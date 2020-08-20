import * as assert from 'assert';
import {
  isListType,
  isNonNullType,
  isCompositeType,
  isEnumType,
  isLeafType,
  isAbstractType,
  getNullableType,
  GraphQLLeafType,
  GraphQLTypeResolver,
  GraphQLFieldResolver,
  defaultTypeResolver,
  defaultFieldResolver,
  getDirectiveValues,
} from 'graphql';

import {
  getRandomInt,
  getRandomItem,
  stdScalarFakers,
  fakeValue,
} from './fake';

type FakeArgs = {
  type: string;
  options: { [key: string]: any };
  locale: string;
};
type ExamplesArgs = {
  values: [any];
};
type ListLengthArgs = {
  min: number;
  max: number;
};
type DirectiveArgs = {
  fake?: FakeArgs;
  examples?: ExamplesArgs;
  listLength?: ListLengthArgs;
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

  let resolved = await defaultFieldResolver(source, args, context, info);
  if (resolved === undefined && source && typeof source === 'object') {
    resolved = source[info.path.key]; // alias value
  }

  if (resolved === undefined) {
    resolved = fakeValueOfType(fieldDef.type);
  }

  if (resolved instanceof Error) {
    return resolved;
  }

  const isMutation = parentType === schema.getMutationType();
  const isCompositeReturn = isCompositeType(getNullableType(fieldDef.type));
  if (isMutation && isCompositeReturn && isPlainObject(resolved)) {
    const inputArg = args['input'];
    return {
      ...(Object.keys(args).length === 1 && isPlainObject(inputArg)
        ? inputArg
        : args),
      ...resolved,
    };
  }

  return resolved;

  function fakeValueOfType(type) {
    if (isNonNullType(type)) {
      return fakeValueOfType(type.ofType);
    }

    if (isListType(type)) {
      return Array(getListLength(fieldDef))
        .fill(null)
        .map(() => fakeValueOfType(type.ofType));
    }

    const valueCB =
      getExampleValueCB(fieldDef) ||
      getFakeValueCB(fieldDef) ||
      getExampleValueCB(type) ||
      getFakeValueCB(type);

    if (isLeafType(type)) {
      if (valueCB) {
        return valueCB();
      }
      return fakeLeafValueCB(type);
    } else {
      // TODO: error on fake directive
      const __typename: string = isAbstractType(type)
        ? getRandomItem(schema.getPossibleTypes(type)).name
        : type.name;

      return {
        __typename,
        ...(valueCB ? valueCB() : {}),
      };
    }
  }

  function getFakeValueCB(object) {
    const fakeDirective = schema.getDirective('fake');
    const args = getDirectiveArgs(fakeDirective, object) as FakeArgs;
    return args && (() => fakeValue(args.type, args.options, args.locale));
  }

  function getExampleValueCB(object) {
    const examplesDirective = schema.getDirective('examples');
    const args = getDirectiveArgs(examplesDirective, object) as ExamplesArgs;
    return args && (() => getRandomItem(args.values));
  }

  function getListLength(object): ListLengthArgs {
    const listLength = schema.getDirective('listLength');
    const args = getDirectiveArgs(listLength, object) as ListLengthArgs;
    return args ? getRandomInt(args.min, args.max) : getRandomInt(2, 4);
  }
};

function fakeLeafValueCB(type: GraphQLLeafType) {
  if (isEnumType(type)) {
    const values = type.getValues().map((x) => x.value);
    return getRandomItem(values);
  }

  const faker = stdScalarFakers[type.name];
  if (faker) return faker();

  return `<${type.name}>`;
}

function getDirectiveArgs(directive, object): DirectiveArgs {
  assert(directive != null);

  let args = undefined;

  if (object.astNode != null) {
    args = getDirectiveValues(directive, object.astNode);
  }

  if (object.extensionNodes != null) {
    for (const node of object.extensionNodes) {
      args = getDirectiveValues(directive, node);
    }
  }

  return args;
}

function isPlainObject(maybeObject) {
  return (
    typeof maybeObject === 'object' &&
    maybeObject !== null &&
    !Array.isArray(maybeObject)
  );
}
