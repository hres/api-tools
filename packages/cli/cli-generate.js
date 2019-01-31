const cli = require('commander');

cli
.name('api-tools generate')
.description(
  'Depending on command options, will parse a Swagger/OpenAPI v2 compliant document and generate corresponding source code, test files, or documentation from it'
)
.command('api', 'generate api source code')
.command('documentation', 'generate api documentation')
.command('tests', 'generate test scripts')
.parse(process.argv);

if (!process.argv.slice(2).length) {
  cli.help();
}
