const {resolve} = require('path');
const cli = require('commander');
const {parseSpec, loadEndpoints} = require('../generator/tests/');

const DEFAULT_ENDPOINTS = 'tests/endpoints.json';

cli
.name('api-tools generate tests')
.description('Generate k6 test scripts based on a Swagger/OpenAPI document')
.option('-s, --source <path>', 'Swagger/OpenAPI document')
.option(
  '-o, --output <dir>',
  'output folder for generated files (default tests/)'
)
.option('-e, --endpoint', 'define a specific endpoint to generate test')
.option('-f, --force', 'forces overwriting of files')
.parse(process.argv);

if (!cli.source) {
  console.log('Need a source file');
  process.exit(1);
}

(async() => {
  parseSpec(cli.source, cli.output || DEFAULT_ENDPOINTS);
  loadEndpoints(cli.output);
})();
