const cli = require('commander');
const { startEditor } = require('@api-tools/editor');

cli
.name('api-tools edit')
.option('-p, --port', 'specify port for the local server', 3000)
.parse(process.argv);

startEditor(cli.port);
