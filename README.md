![GraphQL Faker logo](./docs/faker-logo-text.png)

# GraphQL Faker

[![npm](https://img.shields.io/npm/v/graphql-faker.svg)](https://www.npmjs.com/package/graphql-faker)
[![David](https://img.shields.io/david/APIs-guru/graphql-faker.svg)](https://david-dm.org/APIs-guru/graphql-faker)
[![David](https://img.shields.io/david/dev/APIs-guru/graphql-faker.svg)](https://david-dm.org/APIs-guru/graphql-faker?type=dev)
[![npm](https://img.shields.io/npm/l/graphql-faker.svg)](https://github.com/APIs-guru/graphql-faker/blob/master/LICENSE)
[![docker](https://img.shields.io/docker/build/apisguru/graphql-faker.svg)](https://hub.docker.com/r/apisguru/graphql-faker/)

Mock your future API or extend the existing API with realistic data from [faker.js](https://github.com/Marak/faker.js). __No coding required__.
All you need is to write [GraphQL SDL](https://alligator.io/graphql/graphql-sdl/). Don't worry, we will provide you with examples in our SDL editor.

In the GIF bellow we add fields to types inside real GitHub API and you can make queries from GraphiQL, Apollo, Relay, etc. and receive __real data mixed with mock data.__
![demo-gif](./docs/demo.gif)

## How does it work?

We use `@fake` directive to let you specify how to fake data. And if 60+ fakers is not enough for you, just use `@examples` directive to provide examples. Use `@listLength` directive to specify number of returned array items. Add a directive to any field or custom scalar definition:

    type Person {
      name: String @fake(type: firstName)
      gender: String @examples(values: ["male", "female"])
      pets: [Pet] @listLength(min: 1, max: 10)
    }

No need to remember or read any docs. Autocompletion is included!

## Features

+ 60+ different types of faked data e.g. `streetAddress`, `firstName`, `lastName`, `imageUrl`, `lorem`, `semver`
+ Comes with multiple locales supported
+ Runs as a local server (can be called from browser, cURL, your app, etc.)
+ Interactive editor with autocompletion for directives with GraphiQL embedded
+ ✨ Support for proxying existing GraphQL API and extending it with faked data
![Extend mode diagram](./docs/extend-mode.gif)

## Install

    npm install -g graphql-faker
or

    yarn global add graphql-faker

or run it in a Docker container, see **Usage with Docker**

## TL;DR

Mock GraphQL API based on example SDL and open interactive editor:

    graphql-faker --open

__Note:__ You can specify non-existing SDL file names - Faker will use example SDL which you can edit in interactive editor.

Extend real data from SWAPI with faked data based on extension SDL:

    graphql-faker ./ext-swapi.graphql --extend http://swapi.apis.guru

Extend real data from GitHub API with faked data based on extension SDL (you can get token [here](https://developer.github.com/early-access/graphql/guides/accessing-graphql/#generating-an-oauth-token)):

    graphql-faker ./ext-gh.graphql --extend https://api.github.com/graphql \
    --header "Authorization: bearer <TOKEN>"

## Usage

    graphql-faker [options] [SDL file]

`[SDL file]` - path to file with [SDL](https://alligator.io/graphql/graphql-sdl/). If this argument is omitted Faker uses default file name.

### Options

 * `-p`, `--port`          HTTP Port [default: `env.PORT` or `9002`]
 * `-e`, `--extend`        URL to existing GraphQL server to extend
 * `-o`, `--open`          Open page with SDL editor and GraphiQL in browser
 * `-H`, `--header`        Specify headers to the proxied server in cURL format, e.g.: `Authorization: bearer XXXXXXXXX`
 * `--forward-headers`     Specify which headers should be forwarded to the proxied server
 * `--co`, `--cors-origin` CORS: Specify the custom origin for the Access-Control-Allow-Origin header, by default it is the same as `Origin` header from the request
 * `-h`, `--help`          Show help
 
When specifying the `[SDL file]` after the `--forward-headers` option you need to prefix it with `--` to clarify it's not another header. For example:
```
graphql-faker --extend http://example.com/graphql --forward-headers Authorization -- ./temp.faker.graphql
```
When you finish with an other option there is no need for the `--`:
```
graphql-faker --forward-headers Authorization --extend http://example.com/graphql ./temp.faker.graphql
```

### Usage with Docker

    docker run -p=9002:9002 apisguru/graphql-faker [options] [SDL file]

To specify a custom file, mount a volume where the file is located to `/workdir`:

    docker run -v=${PWD}:/workdir apisguru/graphql-faker path/to/schema.sdl

Because the process is running inside of the container, `--open` does not work.

# Development

```sh
yarn
npm run build:all
npm run start
```
