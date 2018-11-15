let faker = require("faker");

export function hackerFunctions() {
  // Image section
  return {
    // Hacker section
    hackerAbbr: () => faker.hacker.itAbbr(),
    hackerPhrase: () => faker.hacker.phrase()
  };
}
