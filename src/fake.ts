import { allFakers } from '@faker-js/faker';
import * as moment from 'moment';
const baseLocal = 'en';
let faker = allFakers[baseLocal];

export function getRandomInt(min: number, max: number) {
  return faker.number.int({ min, max });
}

export function getRandomItem<T>(array: ReadonlyArray<T>): T {
  return array[getRandomInt(0, array.length - 1)];
}

export const stdScalarFakers = {
  Int: () => faker.number.float({ min: 0, max: 99999, precision: 1 }),
  Float: () => faker.number.float({ min: 0, max: 99999, precision: 0.01 }),
  String: () => 'string',
  Boolean: () => faker.datatype.boolean(),
  ID: () => toBase64(faker.number.int({ max: 9999999999 }).toString()),
};

function toBase64(str) {
  return Buffer.from(str).toString('base64');
}

const fakeFunctions = {
  // Address section
  zipCode: () => faker.location.zipCode(),
  city: () => faker.location.city(),
  // Skipped: faker.address.cityPrefix
  // Skipped: faker.address.citySuffix
  streetName: () => faker.location.street(),
  streetAddress: {
    args: ['useFullAddress'],
    func: (useFullAddress) => faker.location.streetAddress(useFullAddress),
  },
  // Skipped: faker.address.streetSuffix
  // Skipped: faker.address.streetPrefix
  secondaryAddress: () => faker.location.secondaryAddress(),
  county: () => faker.location.county(),
  country: () => faker.location.country(),
  countryCode: () => faker.location.countryCode(),
  state: () => faker.location.state(),
  stateAbbr: () => faker.location.state({ abbreviated: true }),
  latitude: () => faker.location.latitude(),
  longitude: () => faker.location.longitude(),

  // Commerce section
  colorName: () => faker.color.human(),
  productCategory: () => faker.commerce.department(),
  productName: () => faker.commerce.productName(),
  money: {
    args: ['minMoney', 'maxMoney', 'decimalPlaces'],
    func: (min, max, dec) => faker.commerce.price({ min, max, dec }),
  },
  // Skipped: faker.commerce.productAdjective
  productMaterial: () => faker.commerce.productMaterial(),
  product: () => faker.commerce.product(),

  // Company section
  // Skipped: faker.company.companySuffixes
  companyName: () => faker.company.name(),
  // Skipped: faker.company.companySuffix
  companyCatchPhrase: () => faker.company.catchPhrase(),
  companyBs: () => faker.company.buzzPhrase(),
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
  date: {
    args: ['dateFormat', 'dateFrom', 'dateTo'],
    func: (dateFormat, dateFrom, dateTo) =>
      moment(faker.date.between(dateFrom, dateTo))
        .format(dateFormat)
        .toString(),
  },
  pastDate: {
    args: ['dateFormat'],
    func: (dateFormat) => moment(faker.date.past()).format(dateFormat),
  },
  futureDate: {
    args: ['dateFormat'],
    func: (dateFormat) => moment(faker.date.future()).format(dateFormat),
  },
  recentDate: {
    args: ['dateFormat'],
    func: (dateFormat) => moment(faker.date.recent()).format(dateFormat),
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
  hackerAbbreviation: () => faker.hacker.abbreviation(),
  hackerPhrase: () => faker.hacker.phrase(),

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
        url += '#' + faker.number.int();
      }

      return url;
    },
  },

  // Internet section
  avatarUrl: () => faker.internet.avatar(),
  email: {
    args: ['emailProvider'],
    func: (provider) => faker.internet.email(undefined, undefined, provider),
  },
  url: () => faker.internet.url(),
  domainName: () => faker.internet.domainName(),
  ipv4Address: () => faker.internet.ip(),
  ipv6Address: () => faker.internet.ipv6(),
  userAgent: () => faker.internet.userAgent(),
  colorHex: {
    args: ['baseColor'],
    func: ({ red255, green255, blue255 }) => {
      return faker.internet.color(red255, green255, blue255);
    },
  },
  macAddress: () => faker.internet.mac(),
  password: {
    args: ['passwordLength'],
    func: (len) => faker.internet.password(len),
  },

  // Lorem section
  lorem: {
    args: ['loremSize'],
    func: (size) => faker.lorem[size || 'paragraphs'](),
  },

  // Name section
  firstName: () => faker.person.firstName(),
  lastName: () => faker.person.lastName(),
  fullName: () => faker.person.fullName(),
  jobTitle: () => faker.person.jobTitle(),

  // Phone section
  phoneNumber: () => faker.phone.number(),
  // Skipped: faker.phone.phoneNumberFormat
  // Skipped: faker.phone.phoneFormats

  // Random section
  number: {
    args: ['minNumber', 'maxNumber', 'precisionNumber'],
    func: (min, max, precision) => faker.number.float({ min, max, precision }),
  },
  uuid: () => faker.string.uuid(),
  word: () => faker.lorem.word(),
  words: () => faker.lorem.words(),
  locale: () => faker.location.countryCode(),

  // System section
  // Skipped: faker.system.fileName
  // TODO: Add ext
  filename: () => faker.system.commonFileName(),
  mimeType: () => faker.system.mimeType(),
  // Skipped: faker.system.fileType
  // Skipped: faker.system.commonFileType
  // Skipped: faker.system.commonFileExt
  fileExtension: () => faker.system.fileExt(),
  semver: () => faker.system.semver(),
};

Object.keys(fakeFunctions).forEach((key) => {
  const value = fakeFunctions[key];
  if (typeof fakeFunctions[key] === 'function')
    fakeFunctions[key] = { args: [], func: value };
});

export function fakeValue(type, options?, locale?: string) {
  const fakeGenerator = fakeFunctions[type];
  const argNames = fakeGenerator.args;
  //TODO: add check
  const callArgs = argNames.map((name) => options[name]);
  const desiredLocal = allFakers[locale || baseLocal];
  faker = desiredLocal;
  const result = fakeGenerator.func(...callArgs);
  faker = allFakers[baseLocal];
  return result;
}
