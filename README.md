![GraphQL Faker logo](./docs/faker-logo-text.png)

# GraphQL Faker

[![npm](https://img.shields.io/npm/v/graphql-faker.svg)](https://www.npmjs.com/package/graphql-faker)
[![David](https://img.shields.io/david/APIs-guru/graphql-faker.svg)](https://david-dm.org/APIs-guru/graphql-faker)
[![David](https://img.shields.io/david/dev/APIs-guru/graphql-faker.svg)](https://david-dm.org/APIs-guru/graphql-faker?type=dev)
[![npm](https://img.shields.io/npm/l/graphql-faker.svg)](https://github.com/APIs-guru/graphql-faker/blob/master/LICENSE)
[![docker](https://img.shields.io/docker/build/apisguru/graphql-faker.svg)](https://hub.docker.com/r/apisguru/graphql-faker/)

Mock your future API or extend the existing API with realistic data from [faker.js](https://github.com/Marak/faker.js). **No coding required**.

All you need is to write [GraphQL IDL](https://blog.graph.cool/graphql-sdl-schema-definition-language-6755bcb9ce51). Don't worry, we will provide you with examples in our IDL editor.

In the GIF bellow we add fields to types inside real GitHub API and you can make queries from GraphiQL, Apollo, Relay, etc. and receive **real data mixed with mock data.**
![demo-gif](./docs/demo.gif)

## How does it work?

We use `@fake` directive to let you specify how to fake data. And if 60+ fakers is not enough for you, just use `@examples` directive to provide examples. Use `@sample` directive to specify number of returned array items. Add a directive to any field or custom scalar definition:

    type Person {
      name: String @fake(type: firstName)
      gender: String @examples(values: ["male", "female"])
      pets: [Pet] @sample(min: 0, max: 8)
    }

No need to remember or read any docs. Autocompletion is included!

The `@sample` directive is meant to be used for more fine grained constraints and control such as the range of the number of items to return for a particular property.

You can also pass an optional `config` object as the second argument to `fakeSchema` with various options for more fine-grained control.

### Custom configuration

Pass a config object as the second argument to `fakeSchema` to customize how the fake schema is generated. See below for details on various config options.

```js
const config = {
  // ...
};
fakeSchema(schema, config);
```

#### @sample config

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

#### Primitive types

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

#### faker default options

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

#### faker sections

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

#### scalars

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

#### faker

Pass in a custom faker object that implements (or extends) the faker API

```js
const config = {
  // custom faker (override/implementation)
  faker: myFaker
};
```

#### Faker maps

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

#### Custom functions

On top of the customization options outlined here, you also have the option of passing your own functions for:

- `resolveFake`
- `resolveExample`
- `resolveFakeType`
- `resolveFakeOptions`
- `getRandomInt`
- `getRandomItem`
- `fakeValue`
- `typeFakers`
- `createFakers`
- `error`

See the code for more details on how to customize to fit your scenario. You can f.ex use these hooks to lookup values by calling a web API, such as a CMS, a DB lookup or some faker API on the Internet.

### CLI config

Please note that when using the CLI, you can _not_ pass a custom `faker` or faker `sections` when since these contain functions. The JSON config file can only contain static config data.

## Features

- 60+ different types of faked data e.g. `streetAddress`, `firstName`, `lastName`, `imageUrl`, `lorem`, `semver`
- Comes with multiple locales supported
- Runs as a local server (can be called from browser, cURL, your app, etc.)
- Interactive editor with autocompletion for directives with GraphiQL embeded
- ✨ Support for proxying existing GraphQL API and extending it with faked data
  ![Extend mode diagram](./docs/extend-mode.gif)

## Install

    npm install -g graphql-faker

or

    yarn global add graphql-faker

or run it in a Docker container, see **Usage with Docker**

## TL;DR

Mock GraphQL API based on example IDL and open interactive editor:

    graphql-faker --open

**Note:** You can specify non-existing IDL file names - Faker will use example IDL which you can edit in interactive editor.

Extend real data from SWAPI with faked data based on extension IDL:

    graphql-faker ./ext-swapi.grqphql --extend http://swapi.apis.guru

Extend real data from GitHub API with faked data based on extension IDL (you can get token [here](https://developer.github.com/early-access/graphql/guides/accessing-graphql/#generating-an-oauth-token)):

    graphql-faker ./ext-gh.graphql --extend https://api.github.com/graphql \
    --header "Authorization: bearer <TOKEN>"

## CLI Usage

    graphql-faker [options] [IDL file]

`[IDL file]` - path to file with [IDL](https://www.graph.cool/docs/faq/graphql-schema-definition-idl-kr84dktnp0/). If this argument is omited Faker uses default file name.

### Options

- `-c`, `--config` Path to JSON config file used to load config object
- `-p`, `--port` HTTP Port [default: `env.PORT` or `9002`]
- `-e`, `--extend` URL to existing GraphQL server to extend
- `-o`, `--open` Open page with IDL editor and GraphiQL in browser
- `-H`, `--header` Specify headers to the proxied server in cURL format, e.g.: `Authorization: bearer XXXXXXXXX`
- `--forward-headers` Specify which headers should be forwarded to the proxied server
- `--co`, `--cors-origin` CORS: Specify the custom origin for the Access-Control-Allow-Origin header, by default it is the same as `Origin` header from the request
- `-h`, `--help` Show help

When specifying the `[SDL file]` after the `--forward-headers` option you need to prefix it with `--` to clarify it's not another header. For example:

```
graphql-faker --extend http://example.com/graphql --forward-headers Authorition -- ./temp.faker.graphql
```

When you finish with an other option there is no need for the `--`:

```
graphql-faker --forward-headers Authorition --extend http://example.com/graphql ./temp.faker.graphql
```

Using config file `faker-config.json`

```
graphql-faker --extend http://example.com/graphql --config ./faker-config.json -- ./temp.faker.graphql
```

### Usage with Docker

    docker run -p=9002:9002 apisguru/graphql-faker [options] [IDL file]

To specify a custom file, mount a volume where the file is located to `/workdir`:

    docker run -v=${PWD}:/workdir apisguru/graphql-faker path/to/schema.idl

Because the process is running inside of the container, `--open` does not work.

### API usage

To use the API directly, use the exported `run` method, passing the relevant options as demonstrated below:

```js
import { run } from "graphql-faker";

const config = {
  sample: {
    array: {
      min: 1,
      max: 100
    }
  }
};

run({
  extendUrl: "http://example.com/graphql",
  forwardHeaders: "Authorition",
  file: "./temp.faker.graphql",
  config
});
```

# Development

```sh
yarn
npm run build:all
npm run start
```

## Faker types

Usage:

`name: String @fake(type:firstName)`

With arguments:

`image: String @fake(type:imageUrl, options: {imageCategory:cats})`

### Address

- `zipCode` (format)
- `zipCodeByState` (state)
- `city`
- `streetName`
- `streetAddress` (useFullAddress)
- `secondaryAddress`
- `county`
- `country`
- `countryCode`
- `state`
- `stateAbbr`
- `latitude` (min, max, precision)
- `longitude` (min, max, precision)
- `nearbyGPSCoordinate` (latitude, longitude, radius, isMetric)

### Commerce

- `colorName`
- `productCategory`
- `productName`
- `money` (minMoney, maxMoney, decimalPlaces)
- `productMaterial`
- `product`

### Company

- `companyName`
- `companyCatchPhrase`
- `companyBs`

### Database

- `dbColumn`
- `dbType`
- `dbCollation`
- `dbEngine`

### Date

- `pastDate` (dateFormat)
- `futureDate` (dateFormat)
- `recentDate`

### Finance

- `financeAccountName`
- `financeTransactionType`
- `currencyCode`
- `currencyName`
- `currencySymbol`
- `bitcoinAddress`
- `internationalBankAccountNumber`
- `bankIdentifierCode`

### Hacker

- `hackerAbbr`
- `hackerPhrase`

### Image

- `imageUrl` (imageHeight, imageWidth, imageCategory, randomizeImageUrl)

### Internet

- `avatarUrl`
- `email` (emailProvider)
- `url`
- `domainName`
- `ipv4Address`
- `ipv6Address`
- `userAgent`
- `colorHex` (baseColor)
- `macAddress`
- `password` (passwordLenth)

### Lorem

- `lorem` (loremSize)

### Name and title

- `firstName`
- `lastName`
- `fullName`
- `title`
- `jobTitle`

### Phone

- `phoneNumber` (format)

### Random

- `alpha` (count, upcase)
- `alphaNumeric` (count)
- `hexaDecimal` (count)
- `number` (minNumber, maxNumber, precisionNumber)
- `uuid`
- `word`
- `words` (count)
- `locale`
- `filename`
- `mimeType`
- `fileExtension`
- `semver`
