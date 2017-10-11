//import * as faker from 'faker';
const faker = require('faker');
const moment = require('moment');

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
  //TODO: add format arg
  zipCode: () => faker.address.zipCode(),
  city: () => faker.address.city(),
  streetName: () => faker.address.streetName(),
  streetAddress: {
    args: ['useFullAddress'],
    func: (useFullAddress) => faker.address.streetAddress(useFullAddress),
  },
  county: () => faker.address.county(),
  country: () => faker.address.country(),
  countryCode: () => faker.address.countryCode(),
  state: () => faker.address.state(),
  stateAbbr: () => faker.address.stateAbbr(),
  latitude: () => faker.address.latitude(),
  longitude: () => faker.address.longitude(),

  colorName: () => faker.commerce.color(),
  productCategory: () => faker.commerce.department(),
  productName: () => faker.commerce.productName(),
  money: {
    //TODO: add 'dec' and 'symbol'
    args: ['minMoney', 'maxMoney'],
    func: (min, max) => faker.commerce.price(min, max),
  },
  productMaterial: () => faker.commerce.productMaterial(),
  product: () => faker.commerce.product(),

  companyName: () => faker.company.companyName(),
  companyCatchPhrase: () => faker.company.catchPhrase(),
  companyBS: () => faker.company.bs(),

  dbColumn: () => faker.database.column(),
  dbType: () => faker.database.type(),
  dbCollation: () => faker.database.collation(),
  dbEngine: () => faker.database.engine(),

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

  financeAccountName: () => faker.finance.accountName(),
  //TODO: investigate finance.mask
  financeTransactionType: () => faker.finance.transactionType(),
  currencyCode: () => faker.finance.currencyCode(),
  currencyName: () => faker.finance.currencyName(),
  currencySymbol: () => faker.finance.currencySymbol(),
  bitcoinAddress: () => faker.finance.bitcoinAddress(),
  internationalBankAccountNumber: () => faker.finance.iban(),
  bankIdentifierCode: () => faker.finance.bic(),

  hackerAbbr: () => faker.hacker.itAbbr(),
  hackerPhrase: () => faker.hacker.phrase(),

  imageUrl: {
    args: ['imageHeight', 'imageWidth', 'imageCategory', 'randomizeImageUrl'],
    func: (height, width, category, randomize) =>
      faker.image.imageUrl(height, width, category, randomize, false),
  },

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
  colorHex: () => faker.internet.color(),
  macAddress: () => faker.internet.mac(),
  password: {
    args: ['passwordLenth'],
    func: (len) => faker.internet.password(len),
  },

  lorem: {
    args: ['loremSize'],
    func: (size) => faker.lorem[size || 'paragraphs'](),
  },

  firstName: () => faker.name.firstName(),
  lastName: () => faker.name.lastName(),
  fullName: () => faker.name.findName(),
  jobTitle: () => faker.name.jobTitle(),

  //FIXME: phone number

  uuid: () => faker.random.uuid(),
  word: () => faker.random.word(),
  words: () => faker.random.words(),
  locale: () => faker.random.locale(),

  filename: () => faker.system.commonFileName(),
  mimeType: () => faker.system.mimeType(),
  fileExtension: () => faker.system.fileExt(),
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
