let faker = require("faker");

export function commerceFunctions(fakerOpts: any = {}) {
  // Commerce section
  return {
    colorName: () => faker.commerce.color(),
    productCategory: () => faker.commerce.department(),
    productName: () => faker.commerce.productName(),
    money: {
      args: ["minMoney", "maxMoney", "decimalPlaces"],
      func: (min, max, dec) => {
        const opts = {
          ...fakerOpts.money,
          ...{ min, max, dec }
        };
        return faker.commerce.price(opts.min, opts.max, opts.dec);
      }
    },
    // Skipped: faker.commerce.productAdjective
    productMaterial: () => faker.commerce.productMaterial(),
    product: () => faker.commerce.product()
  };
}
