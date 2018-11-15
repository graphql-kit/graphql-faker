let faker = require("faker");

export function nameFunctions() {
  // Name section
  return {
    firstName: () => faker.name.firstName(),
    lastName: () => faker.name.lastName(),
    fullName: () => faker.name.findName(),

    title: () => faker.name.jobTitle(),
    jobTitle: () => faker.name.jobTitle()
  };
}
