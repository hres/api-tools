const {join} = require('path');

module.exports = {
  rootResolve: function(path) {
    if (path == null) return null;
    // need to allow pkg to resolve runtime paths based on the cwd
    return join(process.cwd(), path);
  },

  addTrailingSlash(path) {
    if (path == null) throw new Error(`Path is not valid: ${path}`);
    return path[path.length - 1] === '/' ? path : path + '/';
  }
};
