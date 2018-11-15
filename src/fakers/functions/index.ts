let faker = require("faker");
import { addressFunctions } from "./address";
import { commerceFunctions } from "./commerce";
import { companyFunctions } from "./company";
import { databaseFunctions } from "./database";
import { dateFunctions } from "./date";
import { financeFunctions } from "./finance";
import { randomFunctions } from "./random";
import { internetFunctions } from "./internet";
import { systemFunctions } from "./system";
import { imageFunctions } from "./image";
import { phoneFunctions } from "./phone";
import { hackerFunctions } from "./hacker";
import { loremFunctions } from "./lorem";
import { nameFunctions } from "./name";

export function createFakeFunctions(config: any = {}) {
  faker = config.faker || faker;
  const fakerOpts = config.fakers || {};
  const sections = fakerOpts.sections || {};
  const address = sections.address || addressFunctions(fakerOpts);
  const commerce = sections.commerce || commerceFunctions(fakerOpts);
  const company = sections.company || companyFunctions();
  const database = sections.database || databaseFunctions();
  const date = sections.date || dateFunctions(fakerOpts);
  const finance = sections.finance || financeFunctions();
  const hacker = sections.hacker || hackerFunctions();
  const image = sections.image || imageFunctions();
  const internet = sections.internet || internetFunctions(fakerOpts);
  const lorem = sections.lorem || loremFunctions(fakerOpts);
  const name = sections.name || nameFunctions();
  const phone = sections.phone || phoneFunctions(fakerOpts);
  const random = sections.random || randomFunctions(fakerOpts);
  const system = sections.system || systemFunctions();

  return {
    ...address,
    ...commerce,
    ...company,
    ...database,
    ...date,
    ...finance,
    ...hacker,
    ...image,
    ...internet,
    ...lorem,
    ...name,
    ...phone,
    ...random,
    ...system
  };
}
