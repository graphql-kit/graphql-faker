#!/usr/bin/env node

import * as bodyParser from 'body-parser';
import * as chalk from 'chalk';
import * as cors from 'cors';
import * as express from 'express';
import { graphqlHTTP } from 'express-graphql';
import * as fs from 'fs';
import { printSchema, Source } from 'graphql';
import { express as voyagerMiddleware } from 'graphql-voyager/middleware';
import * as open from 'open';
import * as path from 'path';

import { parseCLI } from './cli';
import { buildWithFakeDefinitions, ValidationErrors } from './fake_definition';
import { fakeFieldResolver, fakeTypeResolver } from './fake_schema';
import { getProxyExecuteFn } from './proxy';
import { existsSync, getRemoteSchema, readSDL } from './utils';

const log = console.log;

const cliOptions = parseCLI();

const { fileName, extendURL, headers, forwardHeaders } = cliOptions;

let userSDL = existsSync(fileName) && readSDL(fileName);

if (extendURL) {
  // run in proxy mode
  getRemoteSchema(extendURL, headers)
    .then((schema) => {
      const remoteSDL = new Source(
        printSchema(schema),
        `Introspection from "${extendURL}"`,
      );

      if (!userSDL) {
        let body = fs.readFileSync(
          path.join(__dirname, 'default-extend.graphql'),
          'utf-8',
        );

        const rootTypeName = schema.getQueryType().name;
        body = body.replace('___RootTypeName___', rootTypeName);

        userSDL = new Source(body, fileName);
      }

      const executeFn = getProxyExecuteFn(extendURL, headers, forwardHeaders);
      runServer(cliOptions, userSDL, remoteSDL, executeFn);
    })
    .catch((error) => {
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
  runServer(cliOptions, userSDL);
}

function runServer(
  options,
  userSDL: Source,
  remoteSDL?: Source,
  customExecuteFn?,
) {
  const { port, openEditor } = options;
  const corsOptions = {
    credentials: true,
    origin: options.corsOrigin,
  };
  const app = express();

  let schema;
  try {
    schema = remoteSDL
      ? buildWithFakeDefinitions(remoteSDL, userSDL)
      : buildWithFakeDefinitions(userSDL);
  } catch (error) {
    if (error instanceof ValidationErrors) {
      prettyPrintValidationErrors(error);
      process.exit(1);
    }
  }

  app.options('/graphql', cors(corsOptions));
  app.use(
    '/graphql',
    cors(corsOptions),
    graphqlHTTP(() => ({
      schema,
      typeResolver: fakeTypeResolver,
      fieldResolver: fakeFieldResolver,
      customExecuteFn,
      graphiql: { headerEditorEnabled: true },
    })),
  );

  app.get('/user-sdl', (_, res) => {
    res.status(200).json({
      userSDL: userSDL.body,
      remoteSDL: remoteSDL?.body,
    });
  });

  app.use('/user-sdl', bodyParser.text({ limit: '8mb' }));
  app.post('/user-sdl', (req, res) => {
    try {
      const fileName = userSDL.name;
      fs.writeFileSync(fileName, req.body);
      userSDL = new Source(req.body, fileName);
      schema = remoteSDL
        ? buildWithFakeDefinitions(remoteSDL, userSDL)
        : buildWithFakeDefinitions(userSDL);

      const date = new Date().toLocaleString();
      log(
        `${chalk.green('✚')} schema saved to ${chalk.magenta(
          fileName,
        )} on ${date}`,
      );

      res.status(200).send('ok');
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  app.use('/editor', express.static(path.join(__dirname, 'editor')));
  app.use('/voyager', voyagerMiddleware({ endpointUrl: '/graphql' }));
  app.use(
    '/voyager.worker.js',
    express.static(
      path.join(
        __dirname,
        '../node_modules/graphql-voyager/dist/voyager.worker.js',
      ),
    ),
  );

  const server = app.listen(port);

  const shutdown = () => {
    server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  log(`\n${chalk.green('✔')} Your GraphQL Fake API is ready to use 🚀
  Here are your links:

  ${chalk.blue('❯')} Interactive Editor: http://localhost:${port}/editor
  ${chalk.blue('❯')} GraphQL API:        http://localhost:${port}/graphql
  ${chalk.blue('❯')} GraphQL Voyager:    http://localhost:${port}/voyager

  `);

  if (openEditor) {
    setTimeout(() => open(`http://localhost:${port}/editor`), 500);
  }
}

function prettyPrintValidationErrors(validationErrors: ValidationErrors) {
  const { subErrors } = validationErrors;
  log(
    chalk.red(
      subErrors.length > 1
        ? `\nYour schema contains ${subErrors.length} validation errors: \n`
        : `\nYour schema contains a validation error: \n`,
    ),
  );

  for (const error of subErrors) {
    const [message, ...otherLines] = error.toString().split('\n');
    log([chalk.yellow(message), ...otherLines].join('\n') + '\n\n');
  }
}
