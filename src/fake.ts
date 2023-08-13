import { allFakers, faker } from '@faker-js/faker';
import * as moment from 'moment';

export function getRandomInt(min: number, max: number) {
  return faker.number.int({ min, max });
}

export function getRandomItem<T>(array: ReadonlyArray<T>): T {
  return array[getRandomInt(0, array.length - 1)];
}

export const stdScalarFakers = {
  Int: () => faker.number.int({ min: 0, max: 99999 }),
  Float: () => faker.number.float({ min: 0, max: 99999, precision: 0.01 }),
  String: () => 'string',
  Boolean: () => faker.datatype.boolean(),
  ID: () => toBase64(faker.number.int({ max: 9999999999 }).toString()),
};

function toBase64(str: string) {
  return Buffer.from(str).toString('base64');
}

function fakeFunctions(fakerInstance: typeof faker) {
  allFakers;
  return {
    // Address section
    zipCode: () => fakerInstance.location.zipCode(),
    city: () => fakerInstance.location.city(),
    // Skipped: faker.address.cityPrefix
    // Skipped: faker.address.citySuffix
    streetName: () => fakerInstance.location.street(),
    streetAddress: {
      args: ['useFullAddress'],
      func: (useFullAddress) =>
        fakerInstance.location.streetAddress(useFullAddress),
    },
    // Skipped: faker.address.streetSuffix
    // Skipped: faker.address.streetPrefix
    secondaryAddress: () => fakerInstance.location.secondaryAddress(),
    county: () => fakerInstance.location.county(),
    country: () => fakerInstance.location.country(),
    countryCode: () => fakerInstance.location.countryCode(),
    state: () => fakerInstance.location.state(),
    stateAbbr: () => fakerInstance.location.state({ abbreviated: true }),
    latitude: () => fakerInstance.location.latitude(),
    longitude: () => fakerInstance.location.longitude(),

    // Commerce section
    colorName: () => fakerInstance.color.human(),
    productCategory: () => fakerInstance.commerce.department(),
    productName: () => fakerInstance.commerce.productName(),
    money: {
      args: ['minMoney', 'maxMoney', 'decimalPlaces'],
      func: (min, max, dec) => fakerInstance.commerce.price({ min, max, dec }),
    },
    // Skipped: faker.commerce.productAdjective
    productMaterial: () => fakerInstance.commerce.productMaterial(),
    product: () => fakerInstance.commerce.product(),

    // Company section
    // Skipped: faker.company.companySuffixes
    companyName: () => fakerInstance.company.name(),
    // Skipped: faker.company.companySuffix
    companyCatchPhrase: () => fakerInstance.company.catchPhrase(),
    companyBs: () => fakerInstance.company.buzzPhrase(),
    // Skipped: faker.company.catchPhraseAdjective
    // Skipped: faker.company.catchPhraseDescriptor
    // Skipped: faker.company.catchPhraseNoun
    // Skipped: faker.company.companyBsAdjective
    // Skipped: faker.company.companyBsBuzz
    // Skipped: faker.company.companyBsNoun

    // Database section
    dbColumn: () => fakerInstance.database.column(),
    dbType: () => fakerInstance.database.type(),
    dbCollation: () => fakerInstance.database.collation(),
    dbEngine: () => fakerInstance.database.engine(),

    // Date section
    date: {
      args: ['dateFormat', 'dateFrom', 'dateTo'],
      func: (dateFormat, dateFrom, dateTo) =>
        moment(fakerInstance.date.between({ from: dateFrom, to: dateTo }))
          .format(dateFormat)
          .toString(),
    },
    pastDate: {
      args: ['dateFormat'],
      func: (dateFormat) =>
        moment(fakerInstance.date.past()).format(dateFormat),
    },
    futureDate: {
      args: ['dateFormat'],
      func: (dateFormat) =>
        moment(fakerInstance.date.future()).format(dateFormat),
    },
    recentDate: {
      args: ['dateFormat'],
      func: (dateFormat) =>
        moment(fakerInstance.date.recent()).format(dateFormat),
    },

    // Finance section
    financeAccountName: () => fakerInstance.finance.accountName(),
    //TODO: investigate finance.mask
    financeTransactionType: () => fakerInstance.finance.transactionType(),
    currencyCode: () => fakerInstance.finance.currencyCode(),
    currencyName: () => fakerInstance.finance.currencyName(),
    currencySymbol: () => fakerInstance.finance.currencySymbol(),
    bitcoinAddress: () => fakerInstance.finance.bitcoinAddress(),
    internationalBankAccountNumber: () => fakerInstance.finance.iban(),
    bankIdentifierCode: () => fakerInstance.finance.bic(),

    // Hacker section
    hackerAbbreviation: () => fakerInstance.hacker.abbreviation(),
    hackerPhrase: () => fakerInstance.hacker.phrase(),

    // Image section
    imageUrl: {
      args: ['imageSize', 'imageKeywords', 'randomizeImageUrl'],
      func: (size, keywords, randomize) => {
        let url = 'https://source.unsplash.com/random/';

        if (size != null) {
          url += `${size.width}x${size.height}/`;
        }

        if (keywords != null && keywords.length > 0) {
          url += '?' + keywords.join(',');
        }

        if (randomize === true) {
          url += '#' + fakerInstance.number.int();
        }

        return url;
      },
    },

    // Internet section
    avatarUrl: () => fakerInstance.internet.avatar(),
    email: {
      args: ['emailProvider'],
      func: (provider) => fakerInstance.internet.email({ provider }),
    },
    url: () => fakerInstance.internet.url(),
    domainName: () => fakerInstance.internet.domainName(),
    ipv4Address: () => fakerInstance.internet.ip(),
    ipv6Address: () => fakerInstance.internet.ipv6(),
    userAgent: () => fakerInstance.internet.userAgent(),
    colorHex: {
      args: ['baseColor'],
      func: ({ redBase, greenBase, blueBase }) => {
        return fakerInstance.internet.color({ redBase, greenBase, blueBase });
      },
    },
    macAddress: () => fakerInstance.internet.mac(),
    password: {
      args: ['passwordLength'],
      func: (len) => fakerInstance.internet.password(len),
    },

    // Lorem section
    lorem: {
      args: ['loremSize'],
      func: (size) => fakerInstance.lorem[size || 'paragraphs'](),
    },

    // Name section
    firstName: () => fakerInstance.person.firstName(),
    lastName: () => fakerInstance.person.lastName(),
    fullName: () => fakerInstance.person.fullName(),
    jobTitle: () => fakerInstance.person.jobTitle(),

    // Phone section
    phoneNumber: () => fakerInstance.phone.number(),
    // Skipped: faker.phone.phoneNumberFormat
    // Skipped: faker.phone.phoneFormats

    // Random section
    number: {
      args: ['minNumber', 'maxNumber', 'precisionNumber'],
      func: (min, max, precision) =>
        fakerInstance.number.float({ min, max, precision }),
    },
    uuid: () => fakerInstance.string.uuid(),
    word: () => fakerInstance.lorem.word(),
    words: () => fakerInstance.lorem.words(),
    locale: () => fakerInstance.helpers.objectKey(allFakers),

    // System section
    // Skipped: faker.system.fileName
    // TODO: Add ext
    filename: () => fakerInstance.system.commonFileName(),
    mimeType: () => fakerInstance.system.mimeType(),
    // Skipped: faker.system.fileType
    // Skipped: faker.system.commonFileType
    // Skipped: faker.system.commonFileExt
    fileExtension: () => fakerInstance.system.fileExt(),
    semver: () => fakerInstance.system.semver(),
  };
}

export function fakeValue(type, options?, locale?) {
  const fakerInstance = locale != null ? allFakers[locale] : faker;
  const fakeGenerator = fakeFunctions(fakerInstance)[type];

  if (typeof fakeGenerator === 'function') {
    return fakeGenerator();
  }
  const callArgs = fakeGenerator.args.map((name) => options[name]);
  return fakeGenerator.func(...callArgs);
}
