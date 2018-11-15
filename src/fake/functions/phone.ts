let faker = require("faker");

export function phoneFunctions(fakerOpts: any = {}) {
  // Image section
  return {
    // Phone section
    phoneNumber: {
      args: ["format"],
      func: format => {
        const opts = {
          ...fakerOpts.phoneNumber,
          ...{ format }
        };
        return faker.phone.phoneNumber(opts.format);
      }
    }
    // Skipped: faker.phone.phoneNumberFormat
    // Skipped: faker.phone.phoneFormats
  };
}
