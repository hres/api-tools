const cli = require('commander');

cli
.name('api-tools generate documentation')
.description(
  'Generate swagger-ui documentation based on a Swagger/OpenAPI document'
)
.option('-s, --source', 'Swagger/OpenAPI document')
.option('-o, --output', 'output folder for generated files (default docs/)')
.parse(process.argv);

if (!process.argv.slice(2).length) {
  cli.outputHelp();
}
