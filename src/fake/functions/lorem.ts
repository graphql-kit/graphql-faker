let faker = require("faker");

export function loremFunctions(fakerOpts: any = {}) {
  // Lorem section
  return {
    lorem: {
      args: ["loremSize"],
      func: size => {
        const opts = {
          ...fakerOpts.lorem,
          ...{ size }
        };
        return faker.lorem[opts.size || "paragraphs"]();
      }
    }
  };
}
