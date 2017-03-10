import {
  Kind,
  buildSchema,
  getNamedType,
  isLeafType,
  isAbstractType,
  GraphQLAbstractType,
  GraphQLOutputType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLEnumType,
  GraphQLScalarType,
  GraphQLLeafType,
} from 'graphql';

import * as fs from 'fs';
import * as _ from 'lodash';
import * as express from 'express';
import * as graphqlHTTP from 'express-graphql';

//import * as faker from 'faker';
const faker = require('faker');

interface GraphQLAppliedDiretives {
  isApplied(directiveName: string): boolean;
  getAppliedDirectives(): Array<string>;
  getDirectiveArgs(directiveName: string): { [argName: string]: any };
}

const fakeDefinitionIDL = fs.readFileSync('./fake_definition.graphql', 'utf-8');
const userIDL = fs.readFileSync('./schema.graphql', 'utf-8');
const idl = fakeDefinitionIDL + userIDL;

const typeFakers = {
  'Int': {
    defaultOptions: {min: 0, max: 99999},
    generator: (options) => {
      options.precision = 1;
      return () => faker.random.number(options);
    }
  },
  'Float': {
    defaultOptions: {min: 0, max: 99999, precision: 0.01},
    generator: (options) => {
      return () => faker.random.number(options);
    }
  },
  'String': {
    defaultOptions: {},
    generator: (options) => {
      return () => 'string';
    }
  },
  'Boolean': {
    defaultOptions: {},
    generator: (options) => {
      return () => faker.random.boolean();
    }
  },
  'ID': {
    defaultOptions: {},
    generator: (options) => {
      return () =>
        new Buffer(
          faker.random.number({max: 9999999999}).toString()
        ).toString('base64');
    }
  },
};
const stdTypeNames = Object.keys(typeFakers);

function getRandomInt(min:number, max:number) {
  return faker.random.number({min, max});
}

function getRandomItem(array:any[]) {
  return array[getRandomInt(0, array.length - 1)];
}

function astToJSON(ast) {
  switch (ast.kind) {
    case Kind.NULL:
      return null;
    case Kind.INT:
      return parseInt(ast.value, 10);
    case Kind.FLOAT:
      return parseFloat(ast.value);
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.LIST:
      return ast.values.map(astToJSON);
    case Kind.OBJECT:
      return ast.fields.reduce((object, {name, value}) => {
        object[name.value] = astToJSON(value);
        return object;
      }, {});
  }
}

type FakeArgs = {
  type:string
  options: {[key:string]: any}
  locale: string
};
type ExamplesArgs = {
  values:[any]
};
type DirectiveArgs = {
  fake?: FakeArgs
  examples?: ExamplesArgs
};

const schema = buildSchema(idl);

const jsonType = schema.getTypeMap()['examples__JSON'];
jsonType.parseLiteral = astToJSON;

_.each(schema.getTypeMap(), type => {
  if (type instanceof GraphQLScalarType && !stdTypeNames.includes(type.name))
    type.serialize = (value => value);
  if (type instanceof GraphQLObjectType && !type.name.startsWith('__'))
    addFakeProperties(type);
  if (isAbstractType(type))
    type.resolveType = (obj => obj.__typename);
});

function addFakeProperties(objectType:GraphQLObjectType) {
  _.each(objectType.getFields(), field => {
    const type = field.type as GraphQLOutputType;
    return field.resolve = getResolver(type, field);
  });
}

const fakeFunctions = {
  zipCode: {
    args: ['zipCodeFormat'],
    func: (format) => faker.address.zipCode(format)
  },
  city: () => faker.address.city(),
  streetName: () => faker.address.streetName(),
  streetAddress: {
    args: ['useFullAddress'],
    func: (useFullAddress) => faker.address.streetAddress(useFullAddress),
  },
  county: () => faker.address.county(),
  country: () => faker.address.country(),
  countryCode: () => faker.address.countryCode(),
  state: () => faker.address.state(),
  stateAbbr: () => faker.address.stateAbbr(),
  latitude: () => faker.address.latitude(),
  longitude: () => faker.address.longitude(),
}

Object.keys(fakeFunctions).forEach(key => {
  var value = fakeFunctions[key];
  if (typeof fakeFunctions[key] === 'function')
    fakeFunctions[key] = {args: [], func: value};
});

function fakeValue(type, options?, locale?) {
  const fakeGenerator = fakeFunctions[type];
  const argNames = fakeGenerator.args;
  //TODO: add check
  const callArgs = argNames.map(name => options[name]);

  const localeBackup = faker.locale;
  //faker.setLocale(locale || localeBackup);
  faker.locale = locale || localeBackup;
  const result = fakeGenerator.func(...callArgs);
  //faker.setLocale(localeBackup);
  faker.locale = localeBackup;
  return result;
}

function getResolver(type:GraphQLOutputType, field) {
  if (type instanceof GraphQLNonNull)
    return getResolver(type.ofType, field);
  if (type instanceof GraphQLList)
    return arrayResolver(getResolver(type.ofType, field));
  if (isAbstractType(type))
    return abstractTypeResolver(type);
  if (isLeafType(type))
    return getLeafResolver(type, field);
  return () => {};
}

function abstractTypeResolver(type:GraphQLAbstractType) {
  const possibleTypes = schema.getPossibleTypes(type);
  return () => ({__typename: getRandomItem(possibleTypes)});
}

function arrayResolver(itemResolver) {
  return (...args) => {
    let length = getRandomInt(2, 4);
    const result = [];

    while (length-- !== 0)
      result.push(itemResolver(...args));
    return result;
  }
}

function getFakeDirectives(object: any) {
  const directives = object['appliedDirectives'] as GraphQLAppliedDiretives;
  if (!directives)
    return {};

  const result = {} as DirectiveArgs;
  if (directives.isApplied('fake'))
    result.fake = directives.getDirectiveArgs('fake') as FakeArgs;
  if (directives.isApplied('examples'))
    result.examples = directives.getDirectiveArgs('examples') as ExamplesArgs;
  return result;
}

function getLeafResolver(type:GraphQLLeafType, field) {
  const directiveToArgs = {
    ...getFakeDirectives(type),
    ...getFakeDirectives(field),
  };

  let {fake, examples} = directiveToArgs;
  if (examples)
    return () => getRandomItem(examples.values)
  if (fake)
    return () => fakeValue(fake.type, fake.options, fake.locale);

  if (type instanceof GraphQLEnumType) {
    const values = type.getValues().map(x => x.value);
    return () => getRandomItem(values);
  }

  const typeFaker = typeFakers[type.name];
  if (typeFaker)
    return typeFaker.generator(typeFaker.defaultOptions);
  else
    return () => `<${type.name}>`;
}

const app = express();

app.use('/graphql', graphqlHTTP({
  schema,
  graphiql: true
}));
app.listen(9002);

console.log('http://localhost:9002/graphql');
