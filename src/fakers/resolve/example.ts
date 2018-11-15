import { examples as exampleMaps } from "../maps";
import { error } from "./error";
const escapeStrRegexp = require("escape-string-regexp");

// TODO: test and make DRY (remove duplication - see resolveFake)
export const resolveExample = ({ field, type, fields, config }) => {
  const $exampleMaps = config.exampleMaps || exampleMaps;

  const typeMap = $exampleMaps.typeMap || {};
  const fieldMap = $exampleMaps.fieldMap || {};

  const typeExamples = typeMap[type] || {};
  const typeFieldMatch = typeExamples[field];
  const $error = config.error || error;

  if (typeFieldMatch) return typeFieldMatch;

  const keys = Object.keys(fieldMap);
  let found;
  const key = keys.find(key => {
    const obj = keys[key];
    if (Array.isArray(obj)) {
      found = obj;
      return key;
    }
    const matches = obj.match || obj.matches || [key];
    if (!Array.isArray(matches)) {
      $error(`resolveArray: ${key} missing matches array. Invalid ${matches}`, {
        type,
        field,
        fields,
        key,
        obj,
        matches
      });
    }
    return matches.find(val => {
      const regExpPattern =
        typeof val === "string" ? escapeStrRegexp(val) : val;
      const regExp = new RegExp(regExpPattern, "i");
      if (regExp.test(field)) {
        found = obj.values;
        return val;
      }
    });
  });
  return key ? found : null;
};
