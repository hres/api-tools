const parser = require('json-schema-ref-parser');

function parse(filepath, includeNonRequired) {
  return parser
  .dereference(filepath)
  .then(({ schemes, basePath, host, paths }) => {
    const endpoints = [];
    // can have multiple http methods for each path
    Object.keys(paths)
    .sort()
    .forEach(path => {
      Object.keys(paths[path]).forEach(method => {
        endpoints.push({
          method: method.toUpperCase(),
          path,
          parameters: paths[path][method].parameters
          .map(getParameterInfo)
          .filter(
            ({ required }) => required === true || includeNonRequired
          )
        });
      });
    });

    return {
      schemes,
      basePath,
      host,
      endpoints
    };
  })
  .catch(err => console.error(err));
}

function getValue(pathParameter) {
  const { name } = pathParameter;
  // keep user_key as a template variable (default 3scale api config)
  if (/(:?user[_-]key)/.test(name)) return '${key}';
  if (pathParameter.value) return pathParameter.value;
  if (pathParameter.default) return pathParameter.default;
  if (pathParameter.example) return pathParameter.example;
  if (pathParameter.enum && pathParameter.enum.length >= 1)
    return pathParameter.enum[0];

  // let the user put in their own value
  return ''; //
}

function getParameterInfo(parameter) {
  const info = {
    name: parameter.name,
    in: parameter.in,
    required: !!parameter.required,
    value: getValue(parameter)
  };

  return info;
}

module.exports = { parse, getValue };
