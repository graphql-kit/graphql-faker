let faker = require("faker");

export function financeFunctions() {
  // Finance section
  return {
    financeAccountName: () => faker.finance.accountName(),
    //TODO: investigate finance.mask
    financeTransactionType: () => faker.finance.transactionType(),
    currencyCode: () => faker.finance.currencyCode(),
    currencyName: () => faker.finance.currencyName(),
    currencySymbol: () => faker.finance.currencySymbol(),
    bitcoinAddress: () => faker.finance.bitcoinAddress(),
    internationalBankAccountNumber: () => faker.finance.iban(),
    bankIdentifierCode: () => faker.finance.bic()
  };
}
