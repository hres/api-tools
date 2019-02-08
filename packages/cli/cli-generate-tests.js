const cli = require('commander');
const { parseSpec, loadEndpoints } = require('@api-tools/generator').Tests;
const { rootResolve, addTrailingSlash, split } = require('@api-tools/utils');

const DEFAULT_OUTDIR = 'tests/';
const DEFAULT_FILENAME = 'test-config.json';

cli
.name('api-tools generate tests')
.description(
  'Generate k6 test scripts based on a Swagger/OpenAPI document. It is a two step process: the first extracts the endpoints from the Swagger document into a JSON-based config file that can be used to populate test scripts options per endpoint, and the second is to read the config to generate the scripts themselves.'
)
.option('-s, --source <file>', 'config file used to generate test scripts')
.option(
  '-o, --outdir <dir>',
  'output folder for generated files',
  DEFAULT_OUTDIR
)
.option(
  '-i, --include-non-required',
  'whether to include non-required parameters in the config file'
)
.option(
  '-t, --template <path>',
  'a file that exports a javascript function that creates a test script'
)
.option(
  '-e, --endpoints <regexps>',
  'only create config file or test scripts for endpoints that match the given regexps',
  split
)
.option('-F, --force', 'forces overwriting of files')
.parse(process.argv);

if (!cli.source) {
  console.error('Need a source file');
  process.exit(1);
}

(async() => {
  if (cli.config) {
    const outdir = addTrailingSlash(rootResolve(cli.outdir || DEFAULT_OUTDIR));
    const filename = cli.filename || DEFAULT_FILENAME;
    const configFile = cli.config || `${outdir}${filename}`;
    await loadEndpoints({
      config: configFile,
      outdir,
      force: cli.force,
      endpoints: cli.onlyEndpoints,
      template: rootResolve(cli.template),
      includeNonRequired: cli.includeNonRequired
    });
  }
})();
