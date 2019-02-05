const querystring = require('querystring');
const { writeFile, readFile, stat, mkdirp } = require('fs-extra');
const { merge, kebabCase } = require('lodash');
const { red } = require('chalk');
const { parse, getValue } = require('./openapi-parser.js');
const generateDefaultTestScript = require('./test-template.js');

const INCLUDE_NON_REQUIRED = false;

async function parseSpec({ source, outdir, filename, force }) {
  return parse(source).then(async spec => {
    try {
      await createDirIfNotExists(outdir, force);
      await writeFile(`${outdir}${filename}`, JSON.stringify(spec, null, 2));
    }
    catch (err) {
      console.error(red(`Could not write file ${outdir}`));
      console.error(err);
      process.exit(1);
    }
  });
}

async function loadEndpoints({ config, outdir, force, endpoints, template }) {
  try {
    const spec = JSON.parse(await readFile(config, 'utf8'));

    // if providing specific endpoints, filter out all the others
    if (endpoints != null && endpoints.length > 0) {
      spec.endpoints = spec.endpoints.filter(
        endpoint =>
          endpoints.filter(e => new RegExp(e).test(endpoint.path)).length > 0
      );
    }

    spec.endpoints.forEach(async route => {
      const { path, parameters } = route;
      const queryParameters = parameters.filter(
        parameter => parameter.in === 'query'
      );
      const pathParameters = parameters.filter(
        parameter => parameter.in === 'path'
      );
      const headerParameters = parameters.filter(
        parameter => parameter.in === 'header'
      );
      const url = generateUrlFromParameters({
        scheme: spec.schemes[0] || 'http',
        host: spec.host,
        basePath: spec.basePath,
        path,
        queryParameters,
        pathParameters
      });

      const requestParameters = {
        headers: generateHeaderParameters({ headerParameters })
      };

      // if user has provided a `template` prop in the config file or provided
      // a `template` option through the cli, use that instead
      let script;
      const args = {
        method: route.method,
        url,
        payload: route.payload,
        requestParameters: merge(route.requestParameters, requestParameters)
      };

      const templateSource = route.template || template;
      if (templateSource != null) {
        console.log(`Using template: ${templateSource}`);
        try {
          script = require(templateSource)(args);
        }
        catch (err) {
          console.error(red(`Could not find template ${templateSource}`));
          console.error(err);
          process.exit(1);
        }
      }
      else {
        script = generateDefaultTestScript(args);
      }

      // write the test scripts
      try {
        await createDirIfNotExists(outdir);
        const path = `${outdir}${route.method}-${kebabCase(
          route.path
        )}.test.js`;
        try {
          await stat(path);
          // does exist, make sure for override
          if (!force) {
            console.error(
              'Path already exists, use -F/--force to force override'
            );
            process.exit(1);
          }
        }
        catch (err) {
          // doesn't exist, not a problem
        }
        await writeFile(path, script);
        console.log(`Generated test script: ${path}`);
      }
      catch (err) {
        console.error(red(`Could not write file ${route.path}`));
        console.error(err);
        process.exit(1);
      }
    });
  }
  catch (err) {
    console.error(red(`Could not load file ${config}`));
    console.error(err);
    process.exit(1);
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
  }
  catch (err) {
    await mkdirp(dir);
  }
}

function generateUrlFromParameters({
  scheme,
  host,
  basePath,
  path,
  queryParameters,
  pathParameters
}) {
  return `${scheme}://${host}${basePath}${replacePathParams(
    path,
    pathParameters
  )}${createQueryString(queryParameters)}`;
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
        console.error(red(
          `In ${path}, no matching parameter name for ${component}`
        ));
      }
      else {
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
  return parameters == null || parameters.length === 0
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

function generateHeaderParameters({ headerParameters }) {
  return headerParameters.reduce((prev, curr) => {
    prev[curr.name] = getValue(curr);
    return prev;
  }, {});
}
