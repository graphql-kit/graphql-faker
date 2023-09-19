import { basename } from 'node:path';
import { parseArgs } from 'node:util';

import * as chalk from 'chalk';

interface Options {
  fileName: string;
  port: number;
  corsOrigin: string | true;
  ssl: boolean
  openEditor: boolean;
  extendURL: string | undefined;
  headers: { [key: string]: string };
  forwardHeaders: ReadonlyArray<string>;
}

export function parseCLI(): Options {
  const [_, execPath] = process.argv;
  const execName = basename(execPath);

  const { values, positionals } = parser();

  if (values.help === false) {
    process.stderr.write(helpMessage());
    process.exit(0);
  }

  if (values.extend == null) {
    if (values.header.length > 0) {
      reportError(
        'Specifying `--header, -H` is supported only in `--extend, -e` mode',
      );
    }
    if (values['forward-headers'].length > 0) {
      reportError(
        'Specifying `--forward-headers` is supported only in `--extend, -e` mode',
      );
    }
  }

  if (positionals.length > 1) {
    reportError('Please specify single SDL file');
  }

  let fileName = positionals[0];
  if (fileName == null) {
    fileName = values.extend
      ? './schema_extension.faker.graphql'
      : './schema.faker.graphql';
    process.stderr.write(
      chalk.yellow(
        `Default file ${chalk.magenta(fileName)} is used. ` +
          `Specify [SDLFile] as argument to change.`,
      ),
    );
  }

  return {
    fileName,
    port: parsePortNumber(values.port),
    ssl: values.ssl,
    corsOrigin: values['cors-origin'] ?? values.co ?? true,
    openEditor: values.open,
    extendURL: values.extend,
    headers: Object.fromEntries(values.header.map(parseHeader)),
    forwardHeaders: values['forward-headers'].map((str) => str.toLowerCase()),
  };

  function parsePortNumber(str: string): number {
    const value = Number.parseInt(str);
    if (!Number.isInteger(value) || value <= 0 || value.toString() !== str) {
      reportError('Invalid port number: ' + str);
    }
    return value;
  }

  function parseHeader(str: string): [name: string, value: string] {
    const [name, ...rest] = str.split(':');
    if (rest.length === 0) {
      reportError(`Header value "${str}" is missing colon`);
    }
    return [name, rest.join(':')];
  }

  function helpMessage(): string {
    return `${execName} [SDLFile]

    Positionals:
      SDLFile  path to file with SDL. If this argument is omitted Faker uses default
               file name                                                    [string]

    Options:
      --version            Show version number                             [boolean]
      -h, --help           Show help                                       [boolean]
      --port, -p           HTTP Port                        [number] [default: 9002]
      --open, -o           Open page with SDL editor and GraphiQL in browser
                                                                           [boolean]
      --ssl, -s            Run over https protocol
                                                                           [boolean]
      --cors-origin, --co  CORS: Specify the custom origin for the
                           Access-Control-Allow-Origin header, by default it is the
                           same as \`Origin\` header from the request
                                                                            [string]
      --extend, -e         URL to existing GraphQL server to extend         [string]
      --header, -H         Specify headers to the proxied server in cURL format,
                           e.g.: "Authorization: bearer XXXXXXXXX"           [array]
      --forward-headers    Specify which headers should be forwarded to the proxied
                           server                                            [array]

    Examples:

    # Mock GraphQL API based on example SDL and open interactive editor
    ${execName} --open

    # Extend real data from SWAPI with faked data based on extension SDL
    ${execName} ./ext-swapi.graphql --extend http://swapi.apis.guru/

    # Extend real data from GitHub API with faked data based on extension SDL
    ${execName} ./ext-gh.graphql --extend https://api.github.com/graphql \
    --header "Authorization: bearer <TOKEN>"
    `;
  }

  function parser() {
    try {
      return parseArgs({
        strict: true,
        allowPositionals: true,
        options: {
          help: {
            short: 'h',
            type: 'boolean',
          },
          port: {
            short: 'p',
            type: 'string',
            default: process.env.PORT || '9002',
          },
          open: {
            short: 'o',
            type: 'boolean',
          },
          'cors-origin': {
            type: 'string',
          },
          // alias for 'cors-origin'
          co: { type: 'string' },
          extend: {
            short: 'e',
            type: 'string',
          },
          header: {
            short: 'H',
            type: 'string',
            multiple: true,
            default: [],
          },
          'forward-headers': {
            type: 'string',
            multiple: true,
            default: [],
          },
          ssl : {
            short: 's',
            type: 'boolean',
          }
        },
      });
    } catch (error) {
      reportError(error.message);
    }
  }

  function reportError(message: string): never {
    process.stderr.write(`${execName}: ${message}\n`);
    process.exit(1);
  }
}
