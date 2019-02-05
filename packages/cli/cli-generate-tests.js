const cli = require('commander');
const { parseSpec, loadEndpoints } = require('@api-tools/generator').Tests;
const { rootResolve, addTrailingSlash } = require('@api-tools/utils');

const DEFAULT_OUTDIR = 'tests/';
const DEFAULT_FILENAME = 'test-config.json';

cli
.name('api-tools generate tests')
.description(
  'Generate k6 test scripts based on a Swagger/OpenAPI document. It is a two step process: the first extracts the endpoints from the Swagger document into a JSON-based config file that can be used to populate test scripts options per endpoint, and the second is to read the config to generate the scripts themselves.'
)
.option('-s, --source <file>', 'Swagger/OpenAPI document')
.option('-C, --config-only', 'only generate the json config document')
.option('-c, --config <file>', 'config file used to generate test scripts')
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

function split(items, token = ',') {
  return items.split(token);
}

if (!cli.source && !cli.config) {
  console.error('Need a source or config file');
  process.exit(1);
}

(async() => {
  const outdir = addTrailingSlash(rootResolve(cli.outdir || DEFAULT_OUTDIR));
  const filename = cli.filename || DEFAULT_FILENAME;
  const configFile = cli.config || `${outdir}${filename}`;
  if (cli.source) {
    const source = rootResolve(cli.source);
    try {
      await parseSpec({
        source,
        outdir,
        filename,
        config: cli.config,
        force: cli.force,
        endpoints: cli.onlyEndpoints
      });
    }
    catch (err) {
      console.error(err);
    }
  }
  if (!cli.configOnly || cli.config) {
    await loadEndpoints({
      config: configFile,
      outdir,
      force: cli.force,
      endpoints: cli.onlyEndpoints,
      template: rootResolve(cli.template)
    });
  }
})();
