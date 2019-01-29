const parser = require('json-schema-ref-parser');

module.exports = {
  parse: function(filepath) {
    return parser
    .dereference(filepath)
    .then(({schemes, basePath, host, paths}) => {
      const endpoints = [];
      // can have multiple http methods for each path
      Object.keys(paths).forEach(path => {
        Object.keys(paths[path]).forEach(method => {
          endpoints.push({
            method: method.toUpperCase(),
            path,
            parameters: paths[path][method].parameters.map(getParameterInfo)
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
  },

  generatePathFromParameters({scheme, host, basePath, path, parameters}) {
    const queryParams = parameters.filter(
      parameter => parameter.in && parameter.in === 'query'
    );
    const pathParams = parameters.filter(
      parameter => parameter.in && parameter.in === 'path'
    );

    let populatedPath = `${scheme}://${host}${basePath}`;

    populatedPath += path
    .split('/')
    .map(component => {
      if (component == null || component.trim().length === 0) return '';
      let match;
      if ((match = component.match(/{(.*)}/))) {
        const replacement = pathParams.find(parameter => {
          return parameter.name.toLowerCase() === match[1].toLowerCase();
        });

        if (replacement == null) {
          console.error(
            `In ${path}, no matching parameter name for ${component}`
          );
        } else {
          const value = getValue(replacement);
          return value;
        }
      }
      return component;
    })
    .join('/');

    populatedPath += '?' + createQueryString(queryParams);

    return populatedPath;
  }
};

function getParameterInfo(parameter) {
  const info = {
    name: parameter.name,
    in: parameter.in,
    required: !!parameter.required,
    value: getValue(parameter)
    // default: parameter.default,
    // enum: parameter.enum,
    // example: parameter.example
  };

  return info;
}

function getValue(pathParameter) {
  // keep user_key as a template variable (default 3scale api config)
  if (pathParameter.name === 'user_key') return '${user_key}';
  if (pathParameter.value) return pathParameter.value;
  if (pathParameter.default) return pathParameter.default;
  if (pathParameter.example) return pathParameter.example;
  if (pathParameter.enum && pathParameter.length >= 1)
    return pathParameter.enum[0];

  // let the user put in their own value
  return ''; //
}

function createQueryString(query) {
  const queryString = query.reduce((queryString, parameter) => {
    if (!('value' in parameter) && !!parameter.required) {
      console.error(`No value provided for query parameter ${parameter.name}`);
      process.exit(1);
    }

    let value = parameter.value;
    let name = parameter.name.toLowerCase();
    if (name === 'user_key') value = '${user_key}';
    return `${queryString}${name}=${value}&`;
  }, '');

  return queryString.substring(0, queryString.length - 1);
}
