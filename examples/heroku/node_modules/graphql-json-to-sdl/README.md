# graphql-json-to-sdl

A command line utility for converting a JSON GraphQL schema to GraphQL SDL.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/graphql-json-to-sdl.svg)](https://npmjs.org/package/graphql-json-to-sdl)
[![CircleCI](https://circleci.com/gh/CDThomas/graphql-json-to-sdl/tree/master.svg?style=shield)](https://circleci.com/gh/CDThomas/graphql-json-to-sdl/tree/master)
[![Codecov](https://codecov.io/gh/CDThomas/graphql-json-to-sdl/branch/master/graph/badge.svg)](https://codecov.io/gh/CDThomas/graphql-json-to-sdl)
[![Downloads/week](https://img.shields.io/npm/dw/graphql-json-to-sdl.svg)](https://npmjs.org/package/graphql-json-to-sdl)
[![License](https://img.shields.io/npm/l/graphql-json-to-sdl.svg)](https://github.com/CDThomas/graphql-json-to-sdl/blob/master/package.json)

# Usage

```bash
$ graphql-json-to-sdl SRC OUT
```

## Arguments:

- SRC: The JSON GraphQL schema to convert
- OUT: The output file

## Options:

- `-h`, `--help`: show CLI help
- `-v`, `--version`: show CLI version

## Example:

```bash
$ graphql-json-to-sdl ./schema.json ./schema.graphql
```
