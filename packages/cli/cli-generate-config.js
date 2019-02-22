const cli = require('commander');
const { red } = require('chalk');
const { parseSpec } = require('../generator').Tests;
const { rootResolve, addTrailingSlash, split } = require('../utils');

const DEFAULT_OUTDIR = './';
const DEFAULT_FILENAME = 'test-config.json';

cli
.name('api-tools generate tests')
.description(
  'Generate test config scripts based on a Swagger/OpenAPI document. It extracts the endpoints from the Swagger document into a JSON-based config file that can be used to populate test scripts options per endpoint'
)
.option('-s, --source <file>', 'Swagger/OpenAPI document')
.option(
  '-o, --outdir <dir>',
  'output folder for generated files',
  DEFAULT_OUTDIR
)
.option(
  '-f, --filename <filename>',
  'define config extract filename',
  DEFAULT_FILENAME
)
.option(
  '-i, --ignore-non-required',
  'whether to ignore non-required parameters in the config file'
)
.option(
  '-e, --endpoints <regexps>',
  'only create config file or test scripts for endpoints that match the given regexps',
  split
)
.option('-F, --force', 'forces overwriting of files')
.parse(process.argv);

(async() => {
  const outdir = addTrailingSlash(rootResolve(cli.outdir || DEFAULT_OUTDIR));
  const filename = cli.filename || DEFAULT_FILENAME;
  if (cli.source) {
    const source = rootResolve(cli.source);
    try {
      await parseSpec({
        source,
        outdir,
        filename,
        force: cli.force,
        endpoints: cli.onlyEndpoints,
        includeNonRequired: !cli.ignoreNonRequired
      });
    }
    catch (err) {
      console.error(err);
    }
  }
  else {
    console.error(red('No source provided'));
  }
})();
