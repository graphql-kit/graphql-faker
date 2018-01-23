//import * as faker from 'faker';
const faker = require('faker');
import * as moment from 'moment';

export function getRandomInt(min:number, max:number) {
  return faker.random.number({min, max});
}

export function getRandomItem(array:any[]) {
  return array[getRandomInt(0, array.length - 1)];
}

export const typeFakers = {
  'Int': {
    defaultOptions: {min: 0, max: 99999},
    generator: (options) => {
      options.precision = 1;
      return () => faker.random.number(options);
    }
  },
  'Float': {
    defaultOptions: {min: 0, max: 99999, precision: 0.01},
    generator: (options) => {
      return () => faker.random.number(options);
    }
  },
  'String': {
    defaultOptions: {},
    generator: () => {
      return () => 'string';
    }
  },
  'Boolean': {
    defaultOptions: {},
    generator: () => {
      return () => faker.random.boolean();
    }
  },
  'ID': {
    defaultOptions: {},
    generator: () => {
      return () =>
        new Buffer(
          faker.random.number({max: 9999999999}).toString()
        ).toString('base64');
    }
  },
};

const fakeFunctions = {
  // Address section
  zipCode: {
    args: ['format'],
    func: (format) => faker.address.zipCode(format)
  },
  city: {
    args: ['format'],
    func: (format) => faker.address.city(format)
  },
  cityPrefix: () => faker.address.cityPrefix(),
  citySuffix: () => faker.address.citySuffix(),
  streetName: () => faker.address.streetName(),
  streetAddress: {
    args: ['useFullAddress'],
    func: (useFullAddress) => faker.address.streetAddress(useFullAddress),
  },
  streetSuffix: () => faker.address.streetSuffix(),
  streetPrefix: () => faker.address.streetPrefix(),
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
  price: {
    args: ['minMoney', 'maxMoney', 'dec', 'symbol'],
    func: (min, max, dec, symbol) => faker.commerce.price(min, max, dec, symbol),
  },
  productAdjective: () => faker.commerce.productAdjective(),
  productMaterial: () => faker.commerce.productMaterial(),
  product: () => faker.commerce.product(),

  // Company section
  companySuffixes: () => faker.company.suffixes(),
  companyName: () => faker.company.companyName(),
  companySuffix: () => faker.company.companySuffix(),
  companyCatchPhrase: () => faker.company.catchPhrase(),
  companyBs: () => faker.company.bs(),
  catchPhraseAdjective: () => faker.company.catchPhraseAdjective(),
  catchPhraseDescriptor: () => faker.company.catchPhraseDescriptor(),
  catchPhraseNoun: () => faker.company.catchPhraseNoun(),
  companyBsAdjective: () => faker.company.bsAdjective(),
  companyBsBuzz: () => faker.company.bsBuzz(),
  companyBsNoun: () => faker.company.bsNoun(),

  // Database section
  dbColumn: () => faker.database.column(),
  dbType: () => faker.database.type(),
  dbCollation: () => faker.database.collation(),
  dbEngine: () => faker.database.engine(),

  // Date section
  pastDate: {
    args: ['dateFormat'],
    func: (dateFormat) => {
      const date = faker.date.past()
      return (dateFormat !== undefined ? moment(date).format(dateFormat) : date)
    }
  },
  futureDate: {
    args: ['dateFormat'],
    func: (dateFormat) => {
      const date = faker.date.future()
      return (dateFormat !== undefined ? moment(date).format(dateFormat) : date)
    }
  },
  recentDate: {
    args: ['dateFormat'],
    func: (dateFormat) => {
      const date = faker.date.recent()
      return (dateFormat !== undefined ? moment(date).format(dateFormat) : date)
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
    args: ['imageHeight', 'imageWidth', 'imageCategory', 'randomizeImageUrl'],
    func: (height, width, category, randomize) =>
      faker.image.imageUrl(height, width, category, randomize, false),
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
    args: ['baseRed255', 'baseGreen255', 'baseBlue255'],
    func: (baseRed255, baseGreen255, baseBlue255) => faker.internet.color(baseRed255, baseGreen255, baseBlue255)
  },
  macAddress: () => faker.internet.mac(),
  password: {
    args: ['passwordLenth'],
    func: (len) => faker.internet.password(len),
  },

  // Lorem section
  lorem: {
    args: ['loremSize'],
    func: (size) => faker.lorem[size || 'paragraphs'](),
  },

  // Name section
  firstName: () => faker.name.firstName(),
  lastName: () => faker.name.lastName(),
  fullName: () => faker.name.findName(),
  jobTitle: () => faker.name.jobTitle(),

  //FIXME: phone number
  // Random section
  uuid: () => faker.random.uuid(),
  word: () => faker.random.word(),
  words: () => faker.random.words(),
  locale: () => faker.random.locale(),

  // System section
  // TODO: Add ext and type
  fileName: () => faker.system.fileName(),
  commonFileName: () => faker.system.commonFileName(),
  mimeType: () => faker.system.mimeType(),
  commonFileType: () => faker.system.commonFileType(),
  commonFileExt: () => faker.system.commonFileExt(),
  fileType: () => faker.system.fileType(),
  fileExt: {
    args: ['mimeType'],
    func: (mimeType) => faker.system.fileExt(mimeType)
  },
  semver: () => faker.system.semver(),
};

Object.keys(fakeFunctions).forEach(key => {
  var value = fakeFunctions[key];
  if (typeof fakeFunctions[key] === 'function')
    fakeFunctions[key] = {args: [], func: value};
});

export function fakeValue(type, options?, locale?) {
  const fakeGenerator = fakeFunctions[type];
  const argNames = fakeGenerator.args;
  //TODO: add check
  const callArgs = argNames.map(name => options[name]);

  const localeBackup = faker.locale;
  //faker.setLocale(locale || localeBackup);
  faker.locale = locale || localeBackup;
  const result = fakeGenerator.func(...callArgs);
  //faker.setLocale(localeBackup);
  faker.locale = localeBackup;
  return result;
}
