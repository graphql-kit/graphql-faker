export const typeMap = {
  Person: {
    name: "fullName"
  },
  User: {
    name: "userName"
  },
  Company: {
    name: "companyName"
  },
  Account: {
    name: "financeAccountName"
  },
  Phone: {
    number: "phoneNumber"
  },
  File: {
    extension: "fileExtension"
  },
  Product: {
    name: "productName",
    category: "productCategory",
    price: {
      type: "money",
      options: {
        minMoney: 10,
        maxMoney: 1000,
        decimalPlaces: 2
      }
    }
  },
  Address: {
    zip: "zipCode",
    code: "zipCode"
  }
};

export const fieldMap = {
  email: ["mail"],
  money: ["price", "amount", "value"],
  filename: ["file"],
  semver: ["version"],
  fileExtension: ["ext"],
  mimeType: ["mime"],
  lorem: ["text", "desc"],
  words: ["title", "'caption'", "label"],
  jobTitle: ["job"],
  ipv4Address: ["ip"],
  url: ["url", "uri"],
  imageUrl: ["image", "img"],
  phoneNumber: ["phone"],
  financeAccountName: ["account"],
  bankIdentifierCode: ["bic"],
  internationalBankAccountNumber: ["iban"],
  uuid: ["id"],
  dbColumn: ["column", "class"],
  companyName: ["company"],
  count: ["number"],
  zipCode: ["zip", "postal"],
  colorName: ["color"],
  longitude: ["lon"],
  latitude: ["lat"],
  productMaterial: ["material"],
  companyCatchPhrase: ["slogan"],
  firstName: ["first"],
  lastName: ["last"],
  alphaNumeric: ["secret", "key"],
  recentDate: ["createdAt", "updatedAt", "changedAt"]
};

export const fakes = {
  typeMap,
  fieldMap
};
