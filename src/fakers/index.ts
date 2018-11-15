//import * as faker from 'faker';
let faker = require("faker");
import { createFakeFunctions } from "./functions";
import { createTypeFakers } from "./type-fakers";
import { types, examples } from "./faker-maps";
export { createTypeFakers, createFakeFunctions };
const escapeStrRegexp = require("escape-string-regexp");

export const maps = { types, examples };

const resolveFakeType = fake => {
  return typeof fake === "string" ? fake : fake.type;
};
const resolveFakeOptions = fake => {
  return typeof fake === "string" ? {} : fake.options;
};

let guessFake = ({ type, field, config }) => {
  const { typeMap, fieldMap } = types;
  const typeFieldMap = config.typeMap || typeMap[type];
  let options = {};
  if (typeFieldMap) {
    const guessed = typeFieldMap[field];
    const type = guessed ? resolveFakeType(guessed) : field;
    options = resolveFakeOptions(guessed) || {};
    return { type, options };
  }
  const matcherFieldMap = config.fieldMap || fieldMap;
  const keys = Object.keys(matcherFieldMap);
  const key = keys.find(key => {
    const values = keys[key];
    return values.find(val => {
      const regExpPattern =
        typeof val === "string" ? escapeStrRegexp(val) : val;
      const regExp = new RegExp(regExpPattern, "i");
      return regExp.test(field);
    });
  });
  return { type: key || field, options };
};

let resolveArray = ({ field, type, config }) => {
  const examples = config.examples || {};
  const typeMap = examples.typeMap || {};
  const typeExamples = typeMap[type] || {};
  const typeFieldMatch = typeExamples[field];

  if (typeFieldMatch) return typeFieldMatch;

  const fieldMap = examples.fieldMap || {};
  const keys = Object.keys(fieldMap);
  let found;
  const key = keys.find(key => {
    const obj = keys[key];
    if (Array.isArray(obj)) {
      found = obj;
      return key;
    }
    const { matches } = obj.match || [key];
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

let error = (msg, reason) => {
  console.error(msg, reason);
  throw new Error(msg);
};

export function createFakers(config) {
  const fakeFunctions = createFakeFunctions(config);
  const typeFakers = createTypeFakers(config);
  guessFake = config.guessFake || guessFake;
  resolveArray = config.resolveArray || resolveArray;
  error = config.error || error;
  faker = config.faker || faker;

  function getRandomInt(min: number, max: number) {
    return faker.random.number({ min, max });
  }

  function getRandomItem(array: any[], config = {}, { type, field }: any = {}) {
    if (!Array.isArray(array)) {
      array = resolveArray({ field, type, config });
    }
    return array[getRandomInt(0, array.length - 1)];
  }

  function fakeValue(fakeType, options?, locale?, typeInfo: any = {}) {
    const { type, field } = typeInfo;
    const guessed = guessFake({ type, field, config });
    fakeType = fakeType || guessed.type;
    options = options || guessed.options || {};

    const fakeGenerator = fakeFunctions[fakeType];
    if (!fakeGenerator) {
      error(`Could not find a matching fake generator for: ${fakeType}`, {
        type,
        field,
        fakeType,
        guessed
      });
    }

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

  Object.keys(fakeFunctions).forEach(key => {
    var value = fakeFunctions[key];
    if (typeof fakeFunctions[key] === "function")
      fakeFunctions[key] = { args: [], func: value };
  });

  return {
    typeFakers,
    fakeFunctions,
    getRandomInt,
    getRandomItem,
    fakeValue
  };
}
