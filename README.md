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
      pets: [Pet] @sample(min: 1, max: 10)
    }

No need to remember or read any docs. Autocompletion is included!

The `@sample` directive is meant to be used for more fine grained constraints and control such as the range of the number of items to return for a particular property.

You can also pass an optional `config` object as the second argument to `fakeSchema` with options for each of the basic supported GraphQL schema (leaf) types, such as `array`, `string` etc.

```js
const pickOne = require("pick-one");
const myRandomFunctions = {
  ...faker.random,
  // override
  word: () => pickOne(["hello", "hi"])
};

const config = {
  // number of items to generate for arrays/lists
  // used by @sample
  sample: {
    array: {
      min: 1,
      max: 100
    }
  },
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
  },
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
    },
    // custom faker sections
    sections: {
      random: myRandomFunctions
    }
  },
  // custom faker (override/implementation)
  faker: myFaker
};

fakeSchema(schema, config);
```

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

## Usage

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

phoneNumber: () => faker.phone.phoneNumber(),

### Random

- `number` (minNumber, maxNumber, precisionNumber)
- `uuid`
- `word`
- `words`
- `locale`
- `filename`
- `mimeType`
- `fileExtension`
- `semver`
