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
import * as open from 'open';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import fetch from 'node-fetch';
import {Headers} from 'node-fetch';

import { parseCLI } from './cli';
import { fakeSchema } from './fake_schema';
import { proxyMiddleware } from './proxy';
import { existsSync } from './utils';

const log = console.log;

parseCLI((options) => {
  const { extendURL, headers } = options;
  const fileName = options.fileName ||
    (extendURL ? './schema_extension.faker.graphql' : './schema.faker.graphql');

  if (!options.fileName) {
    log(chalk.yellow(`Default file ${chalk.magenta(fileName)} is used. ` +
    `Specify [file] parameter to change.`));
  }

  let userSDL = existsSync(fileName) && readSDL(fileName);

  if (extendURL) { // run in proxy mode
    getRemoteSchema(extendURL, headers)
      .then(schema => {
        const remoteSDL = new Source(
          printSchema(schema),
          `Inrospection from "${extendURL}"`,
        );

        if (!userSDL) {
          let body = fs.readFileSync(
            path.join(__dirname, 'default-extend.graphql'),
            'utf-8',
          );

          const rootTypeName = schema.getQueryType().name;
          body = body.replace('<RootTypeName>', rootTypeName);

          userSDL = new Source(body, fileName);
        }

        runServer(options, userSDL, remoteSDL);
      })
      .catch(error => {
        log(chalk.red(error.stack));
        process.exit(1);
      });
  } else {
    if (!userSDL) {
      userSDL = new Source(
        fs.readFileSync(path.join(__dirname, 'default-schema.graphql'), 'utf-8'),
        fileName,
      );
    }
    runServer(options, userSDL);
  }
});

const fakeDefinitionAST = parse(
  readSDL(path.join(__dirname, 'fake_definition.graphql')),
);

function runServer(options, userSDL: Source, remoteSDL?: Source) {
  const { port, openEditor, extendURL, headers, forwardHeaders } = options;
  const corsOptions = {
    credentials: true,
    origin: options.corsOrigin,
  };
  const app = express();

  app.options('/graphql', cors(corsOptions));
  app.use('/graphql', cors(corsOptions), (graphqlHTTP as any)(req => {
    const schemaSDL = remoteSDL ? remoteSDL : userSDL;
    var mergedAST = concatAST([parse(schemaSDL), fakeDefinitionAST]);
    const schema = buildASTSchema(mergedAST);

    if (extendURL) {
      const proxyHeaders = { ...headers };
      for (const name of forwardHeaders) {
        proxyHeaders[name] = req.headers[name];
      }

      const serverRequest = graphqlRequest.bind(this, extendURL, proxyHeaders);
      return {
        ...proxyMiddleware(serverRequest, schema, userSDL),
        graphiql: true,
      };
    } else {
      fakeSchema(schema)
      return { schema, graphiql: true };
    }
  }));

  app.get('/user-sdl', (_, res) => {
    res.status(200).json({
      userSDL: userSDL.body,
      remoteSDL: remoteSDL && remoteSDL.body,
    });
  });

  app.use('/user-sdl', bodyParser.text({limit: '8mb'}));

  app.post('/user-sdl', (req, res) => {
    try {
      const fileName = userSDL.name;
      fs.writeFileSync(fileName, req.body);
      userSDL = new Source(req.body, fileName);

      const date = (new Date()).toLocaleString();
      log(`${chalk.green('✚')} schema saved to ${chalk.magenta(fileName)} on ${date}`);

      res.status(200).send('ok');
    } catch(err) {
      res.status(500).send(err.message)
    }
  });

  app.use('/editor', express.static(path.join(__dirname, 'editor')));

  const server = app.listen(port);

  const shutdown = () => {
    server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  log(`\n${chalk.green('✔')} Your GraphQL Fake API is ready to use 🚀
  Here are your links:

  ${chalk.blue('❯')} Interactive Editor:\t http://localhost:${port}/editor
  ${chalk.blue('❯')} GraphQL API:\t http://localhost:${port}/graphql

  `);

  if (openEditor) {
    setTimeout(() => open(`http://localhost:${port}/editor`), 500);
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
