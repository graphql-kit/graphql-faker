let faker = require("faker");

export function internetFunctions(fakerOpts: any = {}) {
  // Internet section
  return {
    avatarUrl: () => faker.internet.avatar(),
    email: {
      args: ["emailProvider"],
      func: provider => {
        const opts = {
          ...fakerOpts.email,
          ...{ provider }
        };

        return faker.internet.email(undefined, undefined, opts.provider);
      }
    },
    url: () => faker.internet.url(),
    domainName: () => faker.internet.domainName(),
    ipv4Address: () => faker.internet.ip(),
    ipv6Address: () => faker.internet.ipv6(),
    userAgent: () => faker.internet.userAgent(),
    colorHex: {
      args: ["baseColor"],
      func: ({ red255, green255, blue255 }) => {
        return faker.internet.color(red255, green255, blue255);
      }
    },
    macAddress: () => faker.internet.mac(),
    password: {
      args: ["passwordLenth"],
      func: len => {
        const opts = {
          ...fakerOpts.password,
          ...{ len }
        };
        return faker.internet.password(opts.len);
      }
    }
  };
}
