# Customization

Pass a config object as the second argument to `fakeSchema` to customize how the fake schema is generated. See below for details on various config options.

```js
const config = {
  // ...
};
fakeSchema(schema, config);
```

### @sample config

```js
const config = {
  // number of items to generate for arrays/lists
  // used by @sample
  sample: {
    array: {
      min: 1,
      max: 100
    }
  }
};
```

### Primitive types

```js
const config = {
  // primitive types
  types: {
    Int: {
      min: 0,
      max: 99
    },
    Float: {
      min: 0,
      max: 99,
      precision: 0.01
    },
    ID: {
      separator: "_",
      min: 111111,
      max: 999999
    }
  }
};
```

### faker default options

Define default options/arguments for various fakers

```js
const config = {
  // used by fakeFunctions
  fakers: {
    // default arguments for specific fakers
    streetAddress: {
      useFullAddress: true
    },
    money: {
      minMoney: 0,
      maxMoney: 999,
      decimalPlaces: 2
    }
  }
};
```

### faker sections

Pass entire custom faker sections with your own faker generators

```js
const pickOne = require("pick-one");
const myRandomFunctions = {
  ...faker.random,
  // override
  word: () => pickOne(["hello", "hi"])
};

const config = {
    // custom faker sections
    sections: {
      random: myRandomFunctions
    }
  }
}
```

### scalars

Create handlers/generators for your own custom scalars

```js
const config = {
  // create map of resolvers for custom scalars
  scalars: config => {
    const types = config.scalarTypes || {};
    const opts: any = {
      ...defaults,
      ...types
    };
    // custom scalar resolvers
    return {
      Date: {
        defaultOptions: opts.Int,
        generator: (days = 30) => {
          return () => faker.date.recent(days);
        }
      }
    };
  }
};
```

### faker

Pass in a custom faker object that implements (or extends) the faker API

```js
const config = {
  // custom faker (override/implementation)
  faker: myFaker
};
```

### Faker maps

The faker includes faker maps that will guess the faker to be used based on `type` and `field` name.

```gql
type Person {
  name: String
}

type Product {
  label: String
  name: String
}
```

- `Person.name` will be resolved to use the `fullName` faker generator
- `label` will be resolved to `words`
- `Product.name` will be resolved to `productName`

You can pass in your own custom `typeMap` and `fieldMap` in the config object

```js
const { maps } = require("graphql-faker");

const myTypeMap = {
  // custom overrides
  Person: {
    // the faker generator to use to generate a fake value for this field
    name: "firstName"
  },
  Product: {
    name: "productName",
    category: "productCategory",
    // detailed config with options
    price: {
      type: "money",
      options: {
        minMoney: 10,
        maxMoney: 1000,
        decimalPlaces: 2
      }
    }
  }
  // ...
};

const ticker = ["AAPL", "MSFT", "GE", "GOOG", "CNET", "JPM", "NYT"];
const examples = {
  typeMap: {
    Laptop: {
      // takes precedence over color in fieldMap
      color: ["gray", "silver", "black"]
    }
  },
  fieldMap: {
    ...maps.examples.fieldMap,
    ticker: {
      match: ["ticker", "symbol", "stock"],
      values: ticker
    }
  }
};

// requires deep merge
const typeMap = merge(maps.types.typeMap, myTypeMap);

// shallow merge
const fieldMap = {
  ...maps.types.fieldMap,
  // custom overrides
  // each resolved and tested using case insensitive regular expression match
  email: ["mail"],
  cheap: {
    match: ["price"],
    type: "money",
    options: {
      minMoney: 10,
      maxMoney: 100,
      decimalPlaces: 2
    }
  }
  // ...
};

const fakes = {
  typeMap,
  fieldMap
};

const config = {
  fakes,
  examples
};
```

With `examples` in config, we can now simplify the `@examples` directive usage to lookup in the config

```gql
type Person {
  gender: String @examples
}
```

In fact we can simplify even further and leave out the directive all together and the resolver will try each type of resolve mechanism (`@fake` and `@examples`) until a value is returned.

```gql
type Person {
  gender: String
}
```

By using a config object, you can reuse a configuration across multiple projects/schemas with minimal "schema pollution" while still generating appropriate fake values.

### Custom functions

On top of the customization options outlined here, you also have the option of passing your own functions for:

- `getRandomInt`
- `getRandomItem`
- `fakeValue`
- `typeFakers`
- `createFakers`
- `error`

### fake resolvers

On the `config.fake` object

- `resolveFake`
- `resolveExample`
- `resolveFakeType`
- `resolveFakeOptions`

### example resolvers

On the `config.example` object

- `createKeyMatcher`
- `resolveExampleValues`

See the code under `src/fakers/resolve` for more details on how to customize to fit your particular needs.

You can f.ex use these hooks to lookup fake values by:

- lookup in a CMS
- a Database lookup
- fetch data from a public faker/generator API on the WWW
