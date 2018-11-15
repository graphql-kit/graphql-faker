//import * as faker from 'faker';
let faker = require("faker");
import { createFakeFunctions } from "./functions";
import { createTypeFakers } from "./type-fakers";
export { createTypeFakers, createFakeFunctions };
import { resolveExample, resolveFake, error } from "./resolve";

import * as maps from "./maps/";
export { maps };

export function createFakers(config) {
  const fakeFunctions = createFakeFunctions(config);
  const typeFakers = createTypeFakers(config);
  const $resolveFake = config.resolveFake || resolveFake;
  const $resolveExample = config.resolveExample || resolveExample;
  const $error = config.error || error;
  faker = config.faker || faker;

  function getRandomInt(min: number, max: number) {
    return faker.random.number({ min, max });
  }

  function getRandomItem(
    array: any[],
    config = {},
    { type, field, fields }: any = {}
  ) {
    if (!Array.isArray(array)) {
      array = $resolveExample({ field, type, fields, config });
    }
    return array[getRandomInt(0, array.length - 1)];
  }

  function fakeValue(fakeType, options?, locale?, typeInfo: any = {}) {
    const { type, field, fields } = typeInfo;
    const resolvedFake = $resolveFake({ type, field, fields, config });
    fakeType = fakeType || resolvedFake.type;
    options = options || resolvedFake.options || {};

    const fakeGenerator = fakeFunctions[fakeType];
    if (!fakeGenerator) {
      $error(`Could not find a matching fake generator for: ${fakeType}`, {
        type,
        field,
        fakeType,
        resolvedFake
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
