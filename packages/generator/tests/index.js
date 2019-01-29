const querystring = require('querystring');
const {writeFile, readFile, stat, mkdir, remove} = require('fs-extra');
const {parse} = require('./openapi-parser.js');
const generateTestScript = require('./test-template.js');

const INCLUDE_NON_REQUIRED = false;

async function parseSpec({source, outdir, filename, force}) {
  return parse(source).then(async spec => {
    try {
      await createDirIfNotExists(outdir, force);
      await writeFile(`${outdir}${filename}`, JSON.stringify(spec, null, 2));
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  });
}

async function loadEndpoints(filename, outdir, force) {
  try {
    const spec = JSON.parse(await readFile(filename, 'utf8'));
    spec.endpoints.forEach(async route => {
      const url = generateUrlFromParameters({
        scheme: spec.schemes[0] || 'http',
        host: spec.host,
        basePath: spec.basePath,
        path: route.path,
        parameters: route.parameters
      });

      const script = generateTestScript({
        method: route.method,
        url,
        payload: route.payload,
        requestParameters: route.requestParameters
      });

      // write the test scripts
      try {
        await createDirIfNotExists(outdir);
        const path = `${outdir}${toSnake(route.path)}.test.js`;
        try {
          await stat(path);
          // does exist, make sure for override
          if (!force) {
            console.error(
              'Path already exists, use -F/--force to force override'
            );
            process.exit(1);
          }
        } catch (err) {
          // doesn't exist, not a problem
        }
        await writeFile(path, script);
      } catch (err) {
        console.error(`Could not write file ${route.path}: ${err}`);
      }
    });
  } catch (err) {
    console.error(`Could not load file ${filename}: ${err}`);
  }
}

module.exports = {
  parseSpec,
  loadEndpoints
};

async function createDirIfNotExists(dir) {
  // if the output directory doesn't exist, make it
  try {
    await stat(dir);
  } catch (err) {
    await mkdir(dir);
  }
}

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
