#!/usr/bin/env node

const pkg = require('./package.json');
const cli = require('commander');

cli
.name('api-tools')
.version(pkg.version)
.command('edit', 'create/edit Swagger/OpenAPI document')
.command(
  'generate',
  'generate source code, test scripts, and documentation from Swagger/OpenAPI document'
)
.command('test', 'test api endpoints')
.command('report', 'report test result information')
.parse(process.argv);

if (!process.argv.slice(2).length) {
  cli.help();
}
