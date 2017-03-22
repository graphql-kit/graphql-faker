![GraphQL Faker logo](./docs/faker-logo-text.png)

# GraphQL Faker

Mock your future API or extend the existing API with realistic data from [faker.js](....). __No coding required__.
All you need is to write [GraphQL IDL](https://www.graph.cool/docs/faq/graphql-schema-definition-idl-kr84dktnp0/). Don't worry, we will provide you with examples in our IDL editor.

![demo-gif](./docs/demo.gif)

## How does it work
We use `@fake` directive to let you specify how to fake data. And if 60+ fakers is not enough for you, just use `@examples` directive to provide examples. Just add a directive to any field or custom scalar definition:

    type Person {
      name: String @fake(type: firstName)
      gender: String @examples(values: ["male", "female"])
    }

No need to remember or read any docs. Autocompletion is included!

## Features

+ 60+ different types of faked data e.g. `streetAddress`, `firstName`, `lastName`, `imageUrl`, `lorem`, `semver`
+ Comes with multiple locales supported
+ Runs as a local server (can be called from browser, cURL, your app, etc.)
+ Interactive editor with autocompletion for directives with GraphiQL embeded
+ ✨ Support for proxying existing GraphQL API and extending it with faked data

## Install

    npm install -g graphql-faker
or

    yarn global add graphql-faker


## TL;DR

Mock GraphQL API based on IDL and open interactive editor:

    graphql-faker ./my-idl.grqphql --open

Extend real data from SWAPI with faked based on extension IDL:

    graphql-faker ./ext-swapi.grqphql --extend http://swapi.apis.guru

Extend real data from GitHub API with faked based on extension IDL (you can get token [here](https://developer.github.com/early-access/graphql/guides/accessing-graphql/#generating-an-oauth-token)):

    graphql-faker ./ext-gh.graphql --extend https://api.github.com/graphql \
    --header "Authorization: bearer <TOKEN>"

## Usage

    graphql-faker [options] [IDL file]

### Options
 * `-p`, `--port`     HTTP Port [default: `9002`]
 * `-e`, `--extend`   URL to existing GraphQL server to extend
 * `-o`, `--open`     Open page with IDL editor and GraphiQL in browser
 * `-H`, `--header`   Specify headers to the proxied server in cURL format, for e.g.: `Authorization: bearer XXXXXXXXX`
 * `-h`, `--help`     Show help
