import { fakes as fakeMaps } from "../maps";
import { error } from "./error";
import { matchValue, validateFunction, directivesObj } from "./common";

function exampleFuns(config) {
  return directivesObj(config).fake || {};
}

export const resolveFakeType = ({ value, key }: any = {}) => {
  key = key || value;
  return typeof value === "string" ? key : value.type;
};

export const resolveFakeOptions = ({ value }: any = {}) => {
  return typeof value === "string" ? {} : value.options;
};

function resolveFromTypeFieldMap({
  typeFieldMap,
  type,
  field,
  resolvers,
  config,
  error
}) {
  const value = typeFieldMap[field];
  const { resolveFakeType, resolveFakeOptions } = resolvers;
  if (typeof resolveFakeType !== "function") {
    error(
      "resolveFromTypeFieldMap: missing or invalid resolveFakeType function",
      {
        resolveFakeType,
        resolvers,
        config
      }
    );
  }
  const data = { resolvers, config };
  const validateCtx = {
    method: "resolveFromTypeFieldMap",
    data,
    error
  };

  validateFunction({
    ...validateCtx,
    func: resolveFakeType,
    functionName: "resolveFakeType"
  });
  validateFunction({
    ...validateCtx,
    func: resolveFakeOptions,
    functionName: "resolveFakeOptions"
  });

  const fakeType = value
    ? resolveFakeType({ value, type, error, config })
    : field;
  const options = resolveFakeOptions({ value, error, config }) || {};
  return { type: fakeType, options };
}

function createKeyMatcher({ fieldMap, type, field, fields, error }) {
  // ie. fake definition to be resolved
  let matchedValue;
  return function matchFakeByKey(key) {
    const obj = fieldMap[key];
    const matches = Array.isArray(obj) ? obj : obj.match || obj.matches;
    if (!Array.isArray(matches)) {
      error(
        `matchFakeByKey: ${key} missing matches array. Invalid ${matches}`,
        {
          type,
          field,
          fields,
          key,
          obj,
          matches
        }
      );
    }
    matches.find(value => {
      if (matchValue(value, field)) {
        matchedValue = obj.values;
        return value;
      }
    });
    return matchedValue;
  };
}

function resolveFromFieldMap({
  fieldMap,
  type,
  field,
  fields,
  log,
  error,
  config
}) {
  const resolvers = config.resolvers || {};
  const fake = resolvers.fake || {};
  const $createKeyMatcher = fake.createKeyMatcher || createKeyMatcher;
  validateFunction({
    method: "resolveFieldMap",
    func: $createKeyMatcher,
    functionName: "createKeyMatcher",
    data: { config },
    error
  });

  let value;
  const matchKey = $createKeyMatcher({
    fieldMap,
    type,
    field,
    fields,
    log,
    error
  });
  const keys = Object.keys(fieldMap);
  const key = keys.find(key => {
    value = matchKey(key);
    return Boolean(value);
  });
  return { value, key };
}

// TODO: test and make DRY (remove duplication - see resolveFake)
export const resolveFake = ({ type, field, fields, config }) => {
  const $fakeMaps = config.fakeMaps || fakeMaps;
  const typeMap = $fakeMaps.typeMap || {};
  const fieldMap = $fakeMaps.fieldMap || {};
  const log = config.log || console.log;
  const typeFieldMap = typeMap[type];

  const fake = exampleFuns(config);
  const $resolveFakeType = fake.resolveFakeType || resolveFakeType;
  const $resolveFakeOptions = fake.resolveFakeOptions || resolveFakeOptions;
  const $resolveFromFieldMap = fake.resolveFromFieldMap || resolveFromFieldMap;
  const $resolveFromTypeFieldMap =
    fake.resolveFromTypeFieldMap || resolveFromTypeFieldMap;

  const $error = config.error || error;
  let options = {};
  const ctx = { error: $error, config, log };

  if (typeFieldMap) {
    const resolvers = {
      resolveFakeType: $resolveFakeType,
      resolveFakeOptions: $resolveFakeOptions
    };
    return $resolveFromTypeFieldMap({
      typeFieldMap,
      type,
      field,
      resolvers,
      ...ctx
    });
  }
  const { value, key } = $resolveFromFieldMap({
    fieldMap,
    type,
    field,
    fields,
    ...ctx
  });

  return key
    ? {
        type: resolveFakeType({ value, key, ...ctx }),
        options: resolveFakeOptions({ value, ...ctx })
      }
    : { type: field, options };
};
