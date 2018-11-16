import {
  Kind,
  isLeafType,
  isAbstractType,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLAbstractType,
  GraphQLOutputType,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLEnumType,
  GraphQLLeafType
} from "graphql";

import {
  createFakers,
  createFakeFunctions,
  createTypeFakers,
  maps
} from "./fakers";
export { createFakers, createFakeFunctions, createTypeFakers, maps };

interface GraphQLAppliedDiretives {
  isApplied(directiveName: string): boolean;
  getAppliedDirectives(): Array<string>;
  getDirectiveArgs(directiveName: string): { [argName: string]: any };
}

type FakeArgs = {
  type: string;
  options: { [key: string]: any };
  locale: string;
};
type ExamplesArgs = {
  values: [any];
};
type SampleArgs = {
  min: number;
  max: number;
};
type DirectiveArgs = {
  fake?: FakeArgs;
  examples?: ExamplesArgs;
  sample?: SampleArgs;
};

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
      return ast.fields.reduce((object, { name, value }) => {
        object[name.value] = astToJSON(value);
        return object;
      }, {});
  }
}

export function fakeSchema(schema: GraphQLSchema, config: any = {}) {
  const $createFakers = config.createFakers || createFakers;
  const fake = $createFakers(config);

  const typeFakers = config.typeFakers || fake.typeFakers;
  const getRandomItem = config.getRandomItem || fake.getRandomItem;
  const getRandomInt = config.getRandomInt || fake.getRandomInt;
  const fakeValue = config.fakeValue || fake.fakeValue;

  const stdTypeNames = Object.keys(typeFakers);

  const mutationType = schema.getMutationType();
  const jsonType = schema.getTypeMap()["examples__JSON"];
  jsonType["parseLiteral"] = astToJSON;
  const typeMap = schema.getTypeMap();
  const values = Object.values(typeMap);
  for (const type of values) {
    if (
      type instanceof GraphQLScalarType &&
      !stdTypeNames.includes(type.name)
    ) {
      type.serialize = value => value;
      type.parseLiteral = astToJSON;
      type.parseValue = x => x;
    }
    if (type instanceof GraphQLObjectType && !type.name.startsWith("__"))
      addFakeProperties(type);
    if (isAbstractType(type)) type.resolveType = obj => obj.__typename;
  }

  function addFakeProperties(objectType: GraphQLObjectType) {
    const isMutation = objectType === mutationType;
    const fields = objectType.getFields();
    const values = Object.values(fields);
    for (const field of values) {
      if (isMutation && isRelayMutation(field))
        field.resolve = getRelayMutationResolver();
      else field.resolve = getFieldResolver(field, objectType);
    }
  }

  function isRelayMutation(field) {
    const args = field.args;
    if (args.length !== 1 || args[0].name !== "input") return false;

    const inputType = args[0].type;
    // TODO: check presence of 'clientMutationId'
    return (
      inputType instanceof GraphQLNonNull &&
      inputType.ofType instanceof GraphQLInputObjectType &&
      field.type instanceof GraphQLObjectType
    );
  }

  function getFieldResolver(field, objectType, fields?: string[]) {
    const fakeResolver = getResolver(field.type, field, fields);
    return (source, _0, _1, info) => {
      if (source && source.$example && source[field.name]) {
        return source[field.name];
      }

      const value = getCurrentSourceProperty(source, info.path);
      return value !== undefined ? value : fakeResolver(objectType);
    };
  }

  function getRelayMutationResolver() {
    return (source, args, _1, info) => {
      const value = getCurrentSourceProperty(source, info.path);
      if (value instanceof Error) return value;
      return { ...args["input"], ...value };
    };
  }

  // get value or Error instance injected by the proxy
  function getCurrentSourceProperty(source, path) {
    return source && source[path!.key];
  }

  function getResolver(type: GraphQLOutputType, field, fields?: string[]) {
    if (type instanceof GraphQLNonNull)
      return getResolver(type.ofType, field, fields);
    if (type instanceof GraphQLList)
      return arrayResolver(
        getResolver(type.ofType, field, fields),
        getFakeDirectives(field),
        config
      );

    if (isAbstractType(type)) return abstractTypeResolver(type);

    return fieldResolver(type, field, fields);
  }

  function abstractTypeResolver(type: GraphQLAbstractType) {
    const possibleTypes = schema.getPossibleTypes(type);
    return () => ({ __typename: getRandomItem(possibleTypes, config) });
  }

  function fieldResolver(type: GraphQLOutputType, field, fields: string[]) {
    const directiveToArgs = {
      ...getFakeDirectives(type),
      ...getFakeDirectives(field)
    };
    const { fake, examples } = directiveToArgs;

    const genRandom = () =>
      getRandomItem(examples.values, config, { type, field, fields });

    if (isLeafType(type)) {
      if (examples) return () => genRandom();
      if (fake) {
        return () =>
          fakeValue(fake.type, fake.options, fake.locale, {
            type,
            field,
            fields
          });
      }
      return () => {
        // try resolving value based purely on type and field
        try {
          const exValue = genRandom();
          const value =
            exValue ||
            fakeValue(null, null, null, {
              type,
              field,
              fields
            });
          // if no value returned, fallback to using leaf resolver
          return value !== undefined ? value : getLeafResolver(type, config);
        } catch (err) {
          // if error on resolve, fallback to using leaf resolver (ie. generic value by field type)
          return getLeafResolver(type, config);
        }
      };
    } else {
      // TODO: error on fake directive
      if (examples) {
        return () => ({
          ...genRandom(),
          $example: true
        });
      }
      return () => ({});
    }
  }

  function arrayResolver(
    itemResolver,
    { sample }: DirectiveArgs,
    config: any = {}
  ) {
    const sampleOpts = config.sample || config;
    const array = sampleOpts.array || {};
    const opts = array.options || {
      min: 2,
      max: 10
    };
    const options = {
      ...opts,
      ...sample
    } as SampleArgs;

    if (options.min > options.max) {
      options.max = ++options.min;
    }

    return (...args) => {
      let length = getRandomInt(options.min, options.max);
      const result = [];

      while (length-- !== 0) result.push(itemResolver(...args));
      return result;
    };
  }

  function getFakeDirectives(object: any) {
    const directives = object["appliedDirectives"] as GraphQLAppliedDiretives;
    if (!directives) return {};

    const result = {} as DirectiveArgs;
    if (directives.isApplied("fake"))
      result.fake = directives.getDirectiveArgs("fake") as FakeArgs;
    if (directives.isApplied("examples"))
      result.examples = directives.getDirectiveArgs("examples") as ExamplesArgs;
    if (directives.isApplied("sample"))
      result.sample = directives.getDirectiveArgs("sample") as SampleArgs;
    return result;
  }

  function getLeafResolver(type: GraphQLLeafType, config: any = {}) {
    const types = config.types || {};
    const opts = types[type.name];
    if (type instanceof GraphQLEnumType) {
      const values = type.getValues().map(x => x.value);
      return () => getRandomItem(values);
    }

    const typeFaker = typeFakers[type.name];
    if (typeFaker) {
      const typeFakerGenOpts = {
        ...typeFaker.defaultOptions,
        ...opts
      };
      return typeFaker.generator(typeFakerGenOpts);
    } else {
      return () => `<${type.name}>`;
    }
  }
}