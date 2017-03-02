import {
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

import * as _ from 'lodash';
import * as faker from 'faker';
import * as express from 'express';
import * as graphqlHTTP from 'express-graphql';

const idl = `
scalar CustomType
enum EnumType {
  Value1
  Value2
  Value3
  Value4
}
interface Pet {
  name: String
}
type Cat implements Pet {
  name: String
  huntingSkill: String
}
type Dog implements Pet {
  name: String
  packSize: Int
}
union PetUnion = Cat|Dog
type RootQueryType {
  int: Int
  float: Float
  string: String
  boolean: Boolean
  id: ID
  customType: CustomType
  enumType: EnumType
  nonNullInt: Int!
  arrayEnums: [EnumType]
  arrayOfNonNullArraysOfNonNullInt: [[Int!]!]
  petInterface: Pet
  petUnion: PetUnion
}
schema {
  query: RootQueryType
}
`;

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

const schema = buildSchema(idl);

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
    field.resolve = getResolver(type);
  });
}

function getResolver(type:GraphQLOutputType) {
  if (type instanceof GraphQLNonNull)
    return getResolver(type.ofType);
  if (type instanceof GraphQLList)
    return arrayResolver(getResolver(type.ofType));
  if (isLeafType(type))
    return getLeafResolver(type);
  if (isAbstractType(type))
    return abstractTypeResolver(type);
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

function getLeafResolver(type:GraphQLLeafType) {
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
