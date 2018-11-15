let faker = require("faker");

export function databaseFunctions() {
  // Database section
  return {
    dbColumn: () => faker.database.column(),
    dbType: () => faker.database.type(),
    dbCollation: () => faker.database.collation(),
    dbEngine: () => faker.database.engine()
  };
}
