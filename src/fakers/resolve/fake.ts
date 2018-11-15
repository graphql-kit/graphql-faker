import { fakes as fakeMaps } from "../maps";
import { error } from "./error";
const escapeStrRegexp = require("escape-string-regexp");

export const resolveFakeType = ({ value, key }: any = {}) => {
  key = key || value;
  return typeof value === "string" ? key : value.type;
};

export const resolveFakeOptions = ({ value }: any = {}) => {
  return typeof value === "string" ? {} : value.options;
};

// TODO: test and make DRY (remove duplication - see resolveFake)
export const resolveFake = ({ type, field, fields, config }) => {
  const $fakeMaps = config.fakeMaps || fakeMaps;
  const typeMap = $fakeMaps.typeMap || {};
  const fieldMap = $fakeMaps.fieldMap || {};

  const typeFieldMap = typeMap[type];
  const $resolveFakeType = config.resolveFakeType || resolveFakeType;
  const $resolveFakeOptions = config.resolveFakeOptions || resolveFakeOptions;
  const $error = config.error || error;

  let options = {};

  if (typeFieldMap) {
    const guessed = typeFieldMap[field];
    const fakeType = guessed
      ? $resolveFakeType({ value: guessed, type })
      : field;
    options = $resolveFakeOptions({ value: guessed }) || {};
    return { type: fakeType, options };
  }
  const keys = Object.keys(fieldMap);

  let found;
  const key = keys.find(key => {
    const obj = keys[key];
    const matches = Array.isArray(obj) ? obj : obj.match || obj.matches;
    if (!Array.isArray(matches)) {
      $error(`guessFake: ${key} missing matches array. Invalid ${matches}`, {
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
        found = val;
        return val;
      }
    });
  });
  return key
    ? {
        type: resolveFakeType({ value: found, key }),
        options: resolveFakeOptions({ value: found })
      }
    : { type: field, options };
};
