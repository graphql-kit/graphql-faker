//import * as faker from 'faker';
let faker = require("faker");
import { createFakeFunctions } from "./fake-functions";
import { createTypeFakers } from "./type-fakers";

export function createFakers(config) {
  const fakeFunctions = createFakeFunctions(config);
  const typeFakers = createTypeFakers(config);
  faker = config.faker || faker;

  function getRandomInt(min: number, max: number) {
    return faker.random.number({ min, max });
  }

  function getRandomItem(array: any[]) {
    return array[getRandomInt(0, array.length - 1)];
  }

  function fakeValue(type, options?, locale?) {
    const fakeGenerator = fakeFunctions[type];
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
