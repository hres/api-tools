const cli = require('commander');
const {parseSpec, loadEndpoints} = require('../generator/tests/');
const {rootResolve} = require('../../utils');

const DEFAULT_OUTDIR = 'tests/';
const DEFAULT_FILENAME = 'endpoints.json';

cli
.name('api-tools generate tests')
.description(
  'Generate k6 test scripts based on a Swagger/OpenAPI document. It is a two step process: the first generates a JSON file that can be used to populate test scripts options per endpoint, and the second is to read the JSON document to generate the scripts themselves.'
)
.option('-s, --source <path>', 'Swagger/OpenAPI document')
.option(
  '-o, --outdir <dir>',
  'output folder for generated files (default tests/)'
)
.option('-f, --filename', 'define endpoint filename')
.option('-e, --endpoint', 'define a specific endpoint to generate test')
.option('-F, --force', 'forces overwriting of files')
.parse(process.argv);

if (!cli.source) {
  console.error('Need a source file');
  process.exit(1);
}

(async() => {
  const source = rootResolve(cli.source);
  const outdir = addTrailingSlash(rootResolve(cli.outdir || DEFAULT_OUTDIR));
  const filename = cli.filename || DEFAULT_FILENAME;
  const filepath = `${outdir}${filename}`;
  try {
    await parseSpec({
      source,
      outdir,
      filename,
      endpoint: cli.endpoint,
      force: cli.force
    });
    await loadEndpoints(filepath, outdir, cli.force);
  } catch (err) {
    console.error(err);
  }
})();

function addTrailingSlash(path) {
  if (path == null) return null;
  return path[path.length - 1] === '/' ? path : path + '/';
}
