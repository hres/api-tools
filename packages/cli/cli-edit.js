const cli = require('commander');
const {startEditor} = require('../editor/');

cli.name('api-tools edit').parse(process.argv);

startEditor();
