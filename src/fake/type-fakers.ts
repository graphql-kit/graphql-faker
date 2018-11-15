const faker = require("faker");

const defaults = {
  Int: { min: 0, max: 99999 },
  Float: { min: 0, max: 99999, precision: 0.01 },
  String: {},
  Boolean: {},
  ID: { max: 9999999999, separator: ":" }
};

export function createTypeFakers(config: any = {}) {
  const types = config.types || {};
  const opts: any = {
    ...defaults,
    ...types
  };
  return {
    Int: {
      defaultOptions: opts.Int,
      generator: options => {
        options.precision = 1;
        return () => faker.random.number(options);
      }
    },
    Float: {
      defaultOptions: opts.Float,
      generator: options => {
        return () => faker.random.number(options);
      }
    },
    String: {
      defaultOptions: opts.String,
      generator: () => {
        return () => "string";
      }
    },
    Boolean: {
      defaultOptions: opts.Boolean,
      generator: () => {
        return () => faker.random.boolean();
      }
    },
    ID: {
      defaultOptions: opts.ID,
      generator: options => {
        return parentType =>
          new Buffer(
            parentType.name +
              options.separator +
              faker.random.number(options).toString()
          ).toString("base64");
      }
    }
  };
}
