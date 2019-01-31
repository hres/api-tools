const {join} = require('path');
const micro = require('micro');
const handler = require('serve-handler');
const which = require('which');
const execa = require('execa');
const opn = require('opn');
const {red} = require('chalk');

async function startEditor(port = 3000) {
  const basePath = join(__dirname, 'node_modules', 'swagger-editor-dist');
  const server = micro(async(req, res) => {
    return handler(req, res, {public: basePath});
  });

  server.listen(port, () =>
    console.log(`Server listening at http://localhost:${port}`)
  );

  const path = `http://localhost:${port}/index.html`;

  // 'opn' comes with a shell file for xdg-open which breaks during packaging
  // need to do some checking so we don't use opn's xdg-open unless needed
  if (['win32', 'darwin'].includes(process.platform)) {
    await opn(path, {
      wait: false
    });
  } else {
    try {
      const xdgOpenExists = which.sync('xdg-open');
      if (!xdgOpenExists) {
        throw new Error(
          red(
            'xdg-open command not found. Try installing xdg-utils if you want to automatically open this file'
          )
        );
      }
      await execa('xdg-open', [path]);
    } catch (err) {
      console.log(
        red(
          `Unable to open your browser automatically. Please open the following URI in your browser:\n\n${path}\n\n`
        )
      );
    }
  }

  return server;
}

module.exports = {startEditor};
