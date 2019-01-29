const {resolve} = require('path');
const {writeFile, readFile, stat, mkdir} = require('fs-extra');
const querystring = require('querystring');
const {rootResolve} = require('../../../utils.js');
const {parse} = require('./openapi-parser.js');
const generateTestScript = require('./test-template.js');

const TEST_DIR = './test/';
const INCLUDE_NON_REQUIRED = false;

async function parseSpec(filepath, outpath) {
  filepath = rootResolve(filepath);
  outpath = rootResolve(outpath);
  await parse(filepath).then(async spec => {
    // const routes = spec.endpoints.map(route => {
    //   return {
    //     method: route.method,
    //     path: route.path,
    //     parameters: route.parameters,
    //     url: route.url
    //   };
    // });

    // const endpoints = {
    //   schemes: spec.schemes,
    //   host: spec.host,
    //   basePath: spec.basePath,
    //   endpoints: routes
    // };

    try {
      // create endpoints file to be able to fill in values
      await mkdir(
        outpath
        .split('/')
        .slice(0, -1)
        .join('/')
      );
      await writeFile(outpath, JSON.stringify(spec, null, 2));
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  });
}

async function loadEndpoints(filename, outpath, force) {
  try {
    const spec = JSON.parse(await readFile(filename, 'utf8'));

    // if the output directory doesn't exist, make it
    try {
      await stat(TEST_DIR);
    } catch (err) {
      await mkdir(TEST_DIR);
    }

    spec.endpoints.forEach(async route => {
      const url = generateUrlFromParameters({
        scheme: spec.schemes[0] || 'http',
        host: spec.host,
        basePath: spec.basePath,
        path: route.path,
        parameters: route.parameters
      });

      const testScript = generateTestScript({
        method: route.method,
        url,
        payload: route.payload,
        requestParameters: route.requestParameters
      });

      // write the test scripts
      try {
        await writeFile(`./test/${toSnake(route.path)}.test.js`, testScript);
      } catch (err) {
        console.error(`Could not write file ${route.path}: ${err}`);
      }
    });
  } catch (err) {
    console.log(`Could not load file ${filename}: ${err}`);
  }
}

module.exports = {
  parseSpec,
  loadEndpoints
};

function generateUrlFromParameters({scheme, host, basePath, path, parameters}) {
  const queryParams = parameters.filter(
    parameter => parameter.in && parameter.in === 'query'
  );
  const pathParams = parameters.filter(
    parameter => parameter.in && parameter.in === 'path'
  );

  return `${scheme}://${host}${basePath}${replacePathParams(
    path,
    pathParams
  )}${createQueryString(queryParams)}`;
}

function replacePathParams(path, parameters) {
  return path
  .split('/')
  .map(component => {
    if (component == null || component.trim().length === 0) return '';

    // if it's a parameter, '{-}`, use regular expression to replace
    let match;
    if ((match = component.match(/{(.*)}/))) {
      const replacement = parameters.find(parameter => {
        return parameter.name.toLowerCase() === match[1].toLowerCase();
      });

      if (replacement == null) {
        console.error(
          `In ${path}, no matching parameter name for ${component}`
        );
      } else {
        return replacement.value;
      }
    }
    return component;
  })
  .join('/');
}

function createQueryString(
  parameters,
  includeNonRequired = INCLUDE_NON_REQUIRED
) {
  return parameters.length === 0
    ? ''
    : '?' +
        querystring.unescape(
          querystring.stringify(
            parameters.reduce((obj, parameter) => {
              if (parameter.required || includeNonRequired) {
                obj[parameter.name] = parameter.value;
              }

              return obj;
            }, {})
          )
        );
}

function toSnake(path) {
  return path
  .replace(/^\//, '')
  .split('/')
  .join('-');
}
