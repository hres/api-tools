const {resolve} = require('path');

module.exports = {
  rootResolve: function(path) {
    return resolve(__dirname, path);
  }
};
