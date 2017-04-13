import {
  Kind,
  isLeafType,
  isAbstractType,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLAbstractType,
  GraphQLOutputType,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLEnumType,
  GraphQLLeafType,
} from 'graphql';

import {
  getRandomInt,
  getRandomItem,
  typeFakers,
  fakeValue,
} from './fake';

interface GraphQLAppliedDiretives {
  isApplied(directiveName: string): boolean;
  getAppliedDirectives(): Array<string>;
  getDirectiveArgs(directiveName: string): { [argName: string]: any };
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

const stdTypeNames = Object.keys(typeFakers);

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

export function fakeSchema(schema) {
  const mutationTypeName = (schema.getMutationType() || {}).name;
  const jsonType = schema.getTypeMap()['examples__JSON'];
  jsonType.parseLiteral = astToJSON;

  for (let type of Object.values(schema.getTypeMap())) {
    if (type instanceof GraphQLScalarType && !stdTypeNames.includes(type.name))
      type.serialize = (value => value);
    if (type instanceof GraphQLObjectType && !type.name.startsWith('__'))
      addFakeProperties(type);
    if (isAbstractType(type))
      type.resolveType = (obj => obj.__typename);
  };

  function addFakeProperties(objectType:GraphQLObjectType) {
    const isMutation = (objectType.name === mutationTypeName);

    for (let field of Object.values(objectType.getFields())) {
      if (isMutation && isRelayMutation(field))
        field.resolve = getRelayMutationResolver();
      else
        field.resolve = getFieldResolver(field);
    }
  }

  function isRelayMutation(field) {
    const args = field.args;
    if (args.length !== 1 || args[0].name !== 'input')
      return false;

    const inputType = args[0].type;
    // TODO: check presence of 'clientMutationId'
    return (
      inputType instanceof GraphQLNonNull &&
      inputType.ofType instanceof GraphQLInputObjectType &&
      field.type instanceof GraphQLObjectType
    );
  }

  function getFieldResolver(field) {
    const type = field.type as GraphQLOutputType;
    const fakeResolver = getResolver(type, field);
    return (source, _0, _1, info) => {
      const value = getCurrentSourceProperty(source, info.path);
      return (value !== undefined) ? value : fakeResolver();
    }
  }

  function getRelayMutationResolver() {
    return (source, args, _1, info) => {
      const value = getCurrentSourceProperty(source, info.path);
      if (value instanceof Error)
        return value;
      return {...args['input'], ...value};
    }
  }

  // get value or Error instance injected by the proxy
  function getCurrentSourceProperty(source, path) {
    const key = path && path.key;
    return source && source[key];
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
    // TODO: error on fake directive
    // TODO: handle @examples
    return () => ({});
  }

  function abstractTypeResolver(type:GraphQLAbstractType) {
    const possibleTypes = schema.getPossibleTypes(type);
    return () => ({__typename: getRandomItem(possibleTypes)});
  }
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
