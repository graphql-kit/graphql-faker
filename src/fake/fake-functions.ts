let faker = require("faker");
import * as moment from "moment";

export function createFakeFunctions(config: any = {}) {
  faker = config.faker || faker;

  return {
    // Address section
    zipCode: () => faker.address.zipCode(),
    city: () => faker.address.city(),
    // Skipped: faker.address.cityPrefix
    // Skipped: faker.address.citySuffix
    streetName: () => faker.address.streetName(),
    streetAddress: {
      args: ["useFullAddress"],
      func: useFullAddress => {
        const opts = {
          ...config.streetAddress,
          ...{ useFullAddress }
        };
        return faker.address.streetAddress(opts.useFullAddress);
      }
    },
    // Skipped: faker.address.streetSuffix
    // Skipped: faker.address.streetPrefix
    secondaryAddress: () => faker.address.secondaryAddress(),
    county: () => faker.address.county(),
    country: () => faker.address.country(),
    countryCode: () => faker.address.countryCode(),
    state: () => faker.address.state(),
    stateAbbr: () => faker.address.stateAbbr(),
    latitude: () => faker.address.latitude(),
    longitude: () => faker.address.longitude(),

    // Commerce section
    colorName: () => faker.commerce.color(),
    productCategory: () => faker.commerce.department(),
    productName: () => faker.commerce.productName(),
    money: {
      args: ["minMoney", "maxMoney", "decimalPlaces"],
      func: (min, max, dec) => {
        const opts = {
          ...config.money,
          ...{ min, max, dec }
        };
        return faker.commerce.price(opts.min, opts.max, opts.dec);
      }
    },
    // Skipped: faker.commerce.productAdjective
    productMaterial: () => faker.commerce.productMaterial(),
    product: () => faker.commerce.product(),

    // Company section
    // Skipped: faker.company.companySuffixes
    companyName: () => faker.company.companyName(),
    // Skipped: faker.company.companySuffix
    companyCatchPhrase: () => faker.company.catchPhrase(),
    companyBs: () => faker.company.bs(),
    // Skipped: faker.company.catchPhraseAdjective
    // Skipped: faker.company.catchPhraseDescriptor
    // Skipped: faker.company.catchPhraseNoun
    // Skipped: faker.company.companyBsAdjective
    // Skipped: faker.company.companyBsBuzz
    // Skipped: faker.company.companyBsNoun

    // Database section
    dbColumn: () => faker.database.column(),
    dbType: () => faker.database.type(),
    dbCollation: () => faker.database.collation(),
    dbEngine: () => faker.database.engine(),

    // Date section
    pastDate: {
      args: ["dateFormat"],
      func: dateFormat => {
        const opts = {
          ...config.pastDate,
          ...{ dateFormat }
        };

        const date = faker.date.past();
        return dateFormat !== undefined
          ? moment(date).format(opts.dateFormat)
          : date;
      }
    },
    futureDate: {
      args: ["dateFormat"],
      func: dateFormat => {
        const opts = {
          ...config.futureDate,
          ...{ dateFormat }
        };
        const date = faker.date.future();
        return dateFormat !== undefined
          ? moment(date).format(opts.dateFormat)
          : date;
      }
    },
    recentDate: {
      args: ["dateFormat"],
      func: dateFormat => {
        const opts = {
          ...config.recentDate,
          ...{ dateFormat }
        };
        const date = faker.date.recent();
        return dateFormat !== undefined
          ? moment(date).format(opts.dateFormat)
          : date;
      }
    },

    // Finance section
    financeAccountName: () => faker.finance.accountName(),
    //TODO: investigate finance.mask
    financeTransactionType: () => faker.finance.transactionType(),
    currencyCode: () => faker.finance.currencyCode(),
    currencyName: () => faker.finance.currencyName(),
    currencySymbol: () => faker.finance.currencySymbol(),
    bitcoinAddress: () => faker.finance.bitcoinAddress(),
    internationalBankAccountNumber: () => faker.finance.iban(),
    bankIdentifierCode: () => faker.finance.bic(),

    // Hacker section
    hackerAbbr: () => faker.hacker.itAbbr(),
    hackerPhrase: () => faker.hacker.phrase(),

    // Image section
    imageUrl: {
      args: ["imageHeight", "imageWidth", "imageCategory", "randomizeImageUrl"],
      func: (height, width, category, randomize) => {
        const opts = {
          ...config.imageUrl,
          ...{ height, width, category, randomize }
        };
        return faker.image.imageUrl(
          opts.height,
          opts.width,
          opts.category,
          opts.randomize,
          false
        );
      }
    },

    // Internet section
    avatarUrl: () => faker.internet.avatar(),
    email: {
      args: ["emailProvider"],
      func: provider => {
        const opts = {
          ...config.email,
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
          ...config.password,
          ...{ len }
        };
        return faker.internet.password(opts.len);
      }
    },

    // Lorem section
    lorem: {
      args: ["loremSize"],
      func: size => {
        const opts = {
          ...config.lorem,
          ...{ size }
        };
        return faker.lorem[opts.size || "paragraphs"]();
      }
    },

    // Name section
    firstName: () => faker.name.firstName(),
    lastName: () => faker.name.lastName(),
    fullName: () => faker.name.findName(),

    title: () => faker.name.jobTitle(),
    jobTitle: () => faker.name.jobTitle(),

    // Phone section
    phoneNumber: () => faker.phone.phoneNumber(),
    // Skipped: faker.phone.phoneNumberFormat
    // Skipped: faker.phone.phoneFormats

    // Random section
    number: {
      args: ["minNumber", "maxNumber", "precisionNumber"],
      func: (min, max, precision) => {
        const opts = {
          ...config.number,
          ...{ min, max, precision }
        };
        return faker.random.number(opts);
      }
    },
    uuid: () => faker.random.uuid(),
    word: () => faker.random.word(),
    words: () => faker.random.words(),
    locale: () => faker.random.locale(),

    // System section
    // Skipped: faker.system.fileName
    // TODO: Add ext and type
    filename: () => faker.system.commonFileName(),
    mimeType: () => faker.system.mimeType(),
    // Skipped: faker.system.fileType
    // Skipped: faker.system.commonFileType
    // Skipped: faker.system.commonFileExt
    fileExtension: () => faker.system.fileExt(),
    semver: () => faker.system.semver()
  };
}
