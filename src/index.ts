#!/usr/bin/env node

import {
  Source,
  parse,
  concatAST,
  printSchema,
  buildASTSchema,
  buildClientSchema,
  introspectionQuery,
} from 'graphql';

import * as fs from 'fs';
import * as path from 'path';
import * as express from 'express';
import * as graphqlHTTP from 'express-graphql';
import chalk from 'chalk';
import * as opn from 'opn';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import * as yargs from 'yargs';
import fetch from 'node-fetch';
import {Headers} from 'node-fetch';

import { fakeSchema } from './fake_schema';
import { proxyMiddleware } from './proxy';
import { existsSync } from './utils';

const argv = yargs
  .usage('$0 [file]')
  .options({
    'port': {
      alias: 'p',
      describe: 'HTTP Port',
      type: 'number',
      requiresArg: true,
      default: process.env.PORT || 9002,
    },
    'open': {
      alias: 'o',
      describe: 'Open page with SDL editor and GraphiQL in browser',
      type: 'boolean',
    },
    'cors-origin': {
      alias: 'co',
      describe: 'CORS: Specify the custom origin for the Access-Control-Allow-Origin header, by default it is the same as `Origin` header from the request',
      type: 'string',
      requiresArg: true,
      default: true,
    },
    'extend': {
      alias: 'e',
      describe: 'URL to existing GraphQL server to extend',
      type: 'string',
      requiresArg: true,
    },
    'header': {
      alias: 'H',
      describe: 'Specify headers to the proxied server in cURL format, e.g.: "Authorization: bearer XXXXXXXXX"',
      array: true,
      type: 'string',
      requiresArg: true,
      implies: 'extend',
      coerce(arr) {
        const headers = {};
        for (const str of arr) {
          const [, name, value] = str.match(/(.*?):(.*)/);
          headers[name.toLowerCase()] = value.trim();
        }
        return headers;
      },
    },
    'forward-headers': {
      describe: 'Specify which headers should be forwarded to the proxied server',
      array: true,
      type: 'string',
      implies: 'extend',
      coerce(arr) {
        return arr.map(str => str.toLowerCase());
      },
    },
  })
  .strict()
  .help('h')
  .alias('h', 'help')
  .epilog(`Examples:

  # Mock GraphQL API based on example SDL and open interactive editor
  $0 --open

  # Extend real data from SWAPI with faked data based on extension SDL
  $0 ./ext-swapi.grqphql --extend http://swapi.apis.guru/

  # Extend real data from GitHub API with faked data based on extension SDL
  $0 ./ext-gh.graphql --extend https://api.github.com/graphql \\
  --header "Authorization: bearer <TOKEN>"`)
  .argv

const log = console.log;

let fileName = argv.file as string | undefined;
if (!fileName) {
  fileName = argv.extend
    ? './schema_extension.faker.graphql'
    : './schema.faker.graphql';
  log(chalk.yellow(`Default file ${chalk.magenta(fileName)} is used. ` +
  `Specify [file] parameter to change.`));
}

const fakeDefinitionAST = parse(
  readSDL(path.join(__dirname, 'fake_definition.graphql')),
);

if (argv.extend) { // run in proxy mode
  const url = argv.extend;

  getRemoteSchema(url, argv.headers)
    .then(schema => {
      const schemaSDL = new Source(
        printSchema(schema),
        `Inrospection from "${url}"`,
      );

      let extensionSDL;
      if (existsSync(fileName)) {
        extensionSDL = readSDL(fileName)
      } else {
        extensionSDL = readSDL(path.join(__dirname, 'default-extend.graphql'));

        const rootTypeName = schema.getQueryType().name;
        extensionSDL.body =
          extensionSDL.body.replace('<RootTypeName>', rootTypeName);
      }

      runServer(schemaSDL, extensionSDL);
    })
    .catch(error => {
      log(chalk.red(error.stack));
      process.exit(1);
    });
} else {
  const userSDL = existsSync(fileName)
    ? readSDL(fileName)
    : readSDL(path.join(__dirname, 'default-schema.graphql'));
  runServer(userSDL, null);
}

function runServer(schemaSDL: Source, extensionSDL: Source) {
  const app = express();
  const corsOptions = {
    credentials: true,
    origin: argv['cors-origin'],
  };

  app.options('/graphql', cors(corsOptions));
  // TODO: remove any
  app.use('/graphql', cors(corsOptions), (graphqlHTTP as any)(req => {
    var mergedAST = concatAST([parse(schemaSDL), fakeDefinitionAST]);
    const schema = buildASTSchema(mergedAST);

    if (argv.extend) {
      const url = argv.extend;

      // TODO: remove any
      const proxyHeaders = ({ ...(argv['headers'] || {}) } as any);
      for (const name of (argv['forward-headers'] || [])) {
        proxyHeaders[name] = req.headers[name];
      }

      const serverRequest = graphqlRequest.bind(this, url, proxyHeaders);
      return {
        ...proxyMiddleware(serverRequest, schema, extensionSDL),
        graphiql: true,
      };
    } else {
      fakeSchema(schema)
      return {schema};
    }
  }));

  app.get('/user-sdl', (_, res) => {
    res.status(200).json({
      schemaSDL: schemaSDL.body,
      extensionSDL: extensionSDL && extensionSDL.body,
    });
  });

  app.use('/user-sdl', bodyParser.text({limit: '8mb'}));

  app.post('/user-sdl', (req, res) => {
    try {
      fs.writeFileSync(fileName, req.body);
      const newSDL = new Source(req.body, fileName);
      if (extensionSDL === null)
        schemaSDL = newSDL;
      else
        extensionSDL = newSDL;
      log(`${chalk.green('✚')} schema saved to ${chalk.magenta(fileName)} on ${(new Date()).toLocaleString()}`);

      res.status(200).send('ok');
    } catch(err) {
      res.status(500).send(err.message)
    }
  });

  app.use('/editor', express.static(path.join(__dirname, 'editor')));

  const server = app.listen(argv.port);

  const shutdown = () => {
    server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  log(`\n${chalk.green('✔')} Your GraphQL Fake API is ready to use 🚀
  Here are your links:

  ${chalk.blue('❯')} Interactive Editor:\t http://localhost:${argv.port}/editor
  ${chalk.blue('❯')} GraphQL API:\t http://localhost:${argv.port}/graphql

  `);

  if (argv.open) {
    setTimeout(() => opn(`http://localhost:${argv.port}/editor`), 500);
  }
}

function readSDL(filepath) {
  return new Source(
    fs.readFileSync(filepath, 'utf-8'),
    filepath
  );
}

function getRemoteSchema(url, headers) {
  return graphqlRequest(url, headers, introspectionQuery)
    .then(response => {
      if (response.errors) {
        throw Error(JSON.stringify(response.errors, null, 2));
      }
      return buildClientSchema(response.data);
    })
    .catch(error => {
      throw Error(`Can't get introspection from ${url}:\n${error.message}`);
    })
}

function graphqlRequest(url, headers, query, variables?, operationName?) {
  return fetch(url, {
    method: 'POST',
    headers: new Headers({
      "content-type": 'application/json',
      ...(headers || {}),
    }),
    body: JSON.stringify({
      operationName,
      query,
      variables,
    })
  }).then(responce => {
    if (responce.ok)
      return responce.json();
    return responce.text().then(body => {
      throw Error(`${responce.status} ${responce.statusText}\n${body}`);
    });
  });
}
