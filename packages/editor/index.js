const {resolve} = require('path');
const opn = require('opn');
const {red} = require('chalk');

async function startEditor() {
  try {
    const filepath = resolve(
      __dirname,
      './node_modules/swagger-editor-dist/index.html'
    );
    await opn(filepath);
  } catch (err) {
    console.error(red('Could not open browser'));
    console.error(err);
  }
}

module.exports = {startEditor};
