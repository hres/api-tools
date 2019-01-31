const cli = require('commander');

cli
.name('api-tools generate api')
.description('TODO?')
// .description(
//   'Generate full or partial api source code stubs, currently uses Gradle and Spring with Spring Boot. If none of the specified -c/s/m/u options are provided, it will generate the entire project'
// )
// .option(
//   '-p, --package <package>',
//   'defines the \'.\'-separated packaging structure (e.g. api.canada.ca)'
// )
// .option('-c, --controllers')
// .option('-S, --services')
// .option('-m, --models')
// .option('-u, --utils')
.parse(process.argv);
