const {join} = require('path');

module.exports = {
  rootResolve: function(path) {
    // need to allow pkg to resolve runtime paths based on the cwd
    return join(process.cwd(), path);
  }
};
