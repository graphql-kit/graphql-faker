let faker = require("faker");

export function companyFunctions() {
  // Company section
  return {
    // Skipped: faker.company.companySuffixes
    companyName: () => faker.company.companyName(),
    // Skipped: faker.company.companySuffix
    companyCatchPhrase: () => faker.company.catchPhrase(),
    companyBs: () => faker.company.bs()
    // Skipped: faker.company.catchPhraseAdjective
    // Skipped: faker.company.catchPhraseDescriptor
    // Skipped: faker.company.catchPhraseNoun
    // Skipped: faker.company.companyBsAdjective
    // Skipped: faker.company.companyBsBuzz
    // Skipped: faker.company.companyBsNoun
  };
}
