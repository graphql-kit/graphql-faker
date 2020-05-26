import * as yargs from 'yargs';

type Options = {
  fileName: string | undefined;
  port: number;
  corsOrigin: string | true;
  openEditor: boolean;
  extendURL: string | undefined;
  headers: { [key: string]: string };
  forwardHeaders: [string];
};

function builder(cmd) {
  return cmd
    .positional('SDLFile', {
      describe:
        'path to file with SDL. If this argument is omitted Faker uses default file name',
      type: 'string',
      nargs: 1,
    })
    .options({
      port: {
        alias: 'p',
        describe: 'HTTP Port',
        type: 'number',
        requiresArg: true,
        default: process.env.PORT || 9002,
      },
      open: {
        alias: 'o',
        describe: 'Open page with SDL editor and GraphiQL in browser',
        type: 'boolean',
      },
      'cors-origin': {
        alias: 'co',
        describe:
          'CORS: Specify the custom origin for the Access-Control-Allow-Origin header, by default it is the same as `Origin` header from the request',
        type: 'string',
        requiresArg: true,
        default: true,
      },
      extend: {
        alias: 'e',
        describe: 'URL to existing GraphQL server to extend',
        type: 'string',
        requiresArg: true,
      },
      header: {
        alias: 'H',
        describe:
          'Specify headers to the proxied server in cURL format, e.g.: "Authorization: bearer XXXXXXXXX"',
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
        describe:
          'Specify which headers should be forwarded to the proxied server',
        array: true,
        type: 'string',
        implies: 'extend',
        coerce(arr) {
          return arr.map((str) => str.toLowerCase());
        },
      },
    })
    .epilog(epilog)
    .strict();
}

export function parseCLI(commandCB: (options: Options) => void) {
  yargs.usage('$0 [SDLFile]', '', builder, handler).help('h').alias('h', 'help')
    .argv;

  function handler(argv) {
    commandCB({
      fileName: argv.SDLFile,
      port: argv.port,
      corsOrigin: argv['cors-origin'],
      openEditor: argv.open,
      extendURL: argv.extend,
      headers: argv.header || {},
      forwardHeaders: argv.forwardHeaders || [],
    });
  }
}

const epilog = `Examples:

# Mock GraphQL API based on example SDL and open interactive editor
$0 --open

# Extend real data from SWAPI with faked data based on extension SDL
$0 ./ext-swapi.grqphql --extend http://swapi.apis.guru/

# Extend real data from GitHub API with faked data based on extension SDL
$0 ./ext-gh.graphql --extend https://api.github.com/graphql \\
--header "Authorization: bearer <TOKEN>"`;
