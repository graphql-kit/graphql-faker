import { examples as exampleMaps } from "../maps";
import { error } from "./error";
import { matchValue, validateFunction } from "./common";

function resolveExampleValues(obj) {
  return obj.values;
}

function createKeyMatcher({ fieldMap, type, field, fields, error, config }) {
  let matchedValues;
  const $resolveExampleValues =
    config.resolveExampleValues || resolveExampleValues;

  return function matchFakeByKey(key) {
    const obj = fieldMap[key];
    if (Array.isArray(obj)) {
      matchedValues = obj;
      return key;
    }
    const matches = obj.match || obj.matches || [key];
    if (!Array.isArray(matches)) {
      error(`resolveArray: ${key} missing matches array. Invalid ${matches}`, {
        type,
        field,
        fields,
        key,
        obj,
        matches
      });
    }
    matches.find(value => {
      if (matchValue(value, field)) {
        matchedValues = $resolveExampleValues(obj);
        return value;
      }
    });
    return matchedValues;
  };
}

// TODO: split into separate functions for resolving typeMap and fieldMap similar to resolveFake
export const resolveExample = ({ field, type, fields, config }) => {
  const $exampleMaps = config.exampleMaps || exampleMaps;

  const typeMap = $exampleMaps.typeMap || {};
  const fieldMap = $exampleMaps.fieldMap || {};

  const typeExamples = typeMap[type] || {};
  const typeFieldMatch = typeExamples[field];
  const $error = config.error || error;

  if (typeFieldMatch) return typeFieldMatch;

  const example = config.example || {};
  const $createKeyMatcher = example.createKeyMatcher || createKeyMatcher;
  validateFunction({
    method: "resolveExample",
    data: {
      config
    },
    func: $createKeyMatcher,
    functionName: "createKeyMatcher",
    error
  });

  const matchKey = $createKeyMatcher({
    fieldMap,
    type,
    field,
    fields,
    error: $error,
    config
  });
  const keys = Object.keys(fieldMap);
  let values;
  const key = keys.find(key => {
    values = matchKey(key);
    return Boolean(values);
  });

  return key ? values : null;
};
