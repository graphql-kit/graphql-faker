const typeMap = {
  Car: {
    brand: [
      "Ford",
      "Porsche",
      "Audi",
      "Volvo",
      "Toyota",
      "Fiat",
      "BMW",
      "Mercedes-Benz"
    ]
  },
  Laptop: {
    brand: ["Lenovo", "Dell", "HP", "Acer", "Asus", "Apple", "Razer", "Samsung"]
  }
};

const gender = ["male", "female"];
const ticker = ["AAPL", "MSFT", "GE", "GOOG", "CNET", "JPM", "NYT"];

const fieldMap = {
  gender: {
    match: ["gender", "sex"],
    values: gender
  },
  ticker: {
    match: ["ticker", "symbol", "stock"],
    values: ticker
  }
};

export const examples = {
  typeMap,
  fieldMap
};
