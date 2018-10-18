import * as assert from 'assert';
import {
  isListType,
  isNonNullType,
  isObjectType,
  isInputObjectType,
  isEnumType,
  isLeafType,
  isAbstractType,
  GraphQLLeafType,
  GraphQLTypeResolver,
  GraphQLFieldResolver,
  defaultTypeResolver,
  defaultFieldResolver,
  getDirectiveValues,
} from 'graphql';

import { getRandomInt, getRandomItem, stdScalarFakers, fakeValue } from './fake';

type FakeArgs = {
  type: string;
  options: {[key: string]: any};
  locale: string;
};
type ExamplesArgs = {
  values: [any];
};
type ListLenghtArgs = {
  min: number;
  max: number;
};
type DirectiveArgs = {
  fake?: FakeArgs;
  examples?: ExamplesArgs;
  listLength?: ListLenghtArgs;
};

export const fakeTypeResolver: GraphQLTypeResolver<unknown, unknown> = async (
  value,
  context,
  info,
  abstractType,
) => {
  const defaultResolved = await defaultTypeResolver(
    value,
    context,
    info,
    abstractType,
  );
  if (defaultResolved != null) {
    return defaultResolved;
  }

  const possibleTypes = info.schema.getPossibleTypes(abstractType);
  return getRandomItem(possibleTypes);
};

export const fakeFieldResolver: GraphQLFieldResolver<unknown, unknown> = async (
  source,
  args,
  context,
  info,
) => {
  const { schema, parentType, fieldName } = info;
  const fieldDef = parentType.getFields()[fieldName];
  const fieldDirectives = getFakeDirectives(schema, fieldDef);

  let defaultResolved = await defaultFieldResolver(source, args, context, info);
  if (defaultResolved instanceof Error) {
    return defaultResolved;
  }

  const mutationType = schema.getMutationType();
  const isMutation = parentType === mutationType;
  if (isMutation && isRelayMutation(fieldDef)) {
    return { ...args['input'], ...(defaultResolved || {}) };
  }

  if (defaultResolved != null) {
    return defaultResolved;
  }

  return fakeValueOfType(fieldDef.type);

  function fakeValueOfType(type) {
    if (isNonNullType(type)) {
      return fakeValueOfType(type.ofType);
    }
    if (isListType(type)) {
      const listLength = fieldDirectives.listLength || { min: 2, max: 4 };
      return Array(getRandomInt(listLength.min, listLength.max))
        .fill(() => fakeValueOfType(type.ofType));
    }

    const {fake, examples} = {
      ...getFakeDirectives(schema, type),
      ...fieldDirectives,
    };

    if (isLeafType(type)) {
      if (examples) return getRandomItem(examples.values);
      if (fake) {
        return fakeValue(fake.type, fake.options, fake.locale);
      }
      return fakeLeafValue(type);
    } else {
      // TODO: error on fake directive
      const possibleTypes = isAbstractType(type)
        ? schema.getPossibleTypes(type)
        : [type];

      return {
        __typename: getRandomItem(possibleTypes),
        ...(examples ? getRandomItem(examples.values) : {}),
      };
    }
  }
};

function fakeLeafValue(type: GraphQLLeafType) {
  if (isEnumType(type)) {
    const values = type.getValues().map(x => x.value);
    return getRandomItem(values);
  }

  const faker = stdScalarFakers[type.name];
  if (faker) return faker();

  return `<${type.name}>`;
}

function isRelayMutation(fieldDef) {
  const { args } = fieldDef;
  if (args.length !== 1 || args[0].name !== 'input') {
    return false;
  }

  const inputType = args[0].type;
  // TODO: check presence of 'clientMutationId'
  return (
    isNonNullType(inputType) &&
    isInputObjectType(inputType.ofType) &&
    isObjectType(fieldDef.type)
  );
}

function getFakeDirectives(schema, object): DirectiveArgs {
  const fakeDirective = schema.getDirective('fake');
  const examplesDirective = schema.getDirective('examples');
  const listLenghtDirective = schema.getDirective('listLength');
  assert(fakeDirective != null && examplesDirective != null);

  const nodes = [];
  if (object.astNode != null) {
    nodes.push(object.astNode);
  }
  if (object.extensionNodes != null) {
    nodes.push(...object.extensionNodes);
  }

  const result = {} as DirectiveArgs;
  for (const node of nodes) {
    result.fake = getDirectiveValues(fakeDirective, node) as FakeArgs;
    result.examples = getDirectiveValues(examplesDirective, node) as ExamplesArgs;
    result.listLength = getDirectiveValues(listLenghtDirective, node) as ListLenghtArgs;
  }
  return result;
}
