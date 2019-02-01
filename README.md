# API Tools

A collection of tools to help with building GoC compliant API's, including:

- openapi documentation editor
- testscript generation with performance testing

## Usage

### Creating/Editing a Swagger/OpenAPI document

`api-tools edit` will serve a swagger-editor web page. Use the 'file' tab to import/export documents

### Generating Files

`api-tools generate` generates various files depending on sub-commands

`api-tools generate tests` will parse a Swagger/OpenAPI document, extract the endpoints and the necessary information to create a valid URL and supply headers parameters, and save it into a configuration file that can be modified. This configuration file is used to generate [k6](https://k6.io) test scripts. See --help for options. Often used are `-f, --filename` to name the config file, `-c, --config` to load from a specific config file, `-e,--endpoints` to restrict generation to only certain endpoints, and `-t,--template` to define a custom template to use to generate the test script (NOTE: you can also provide a `template` key whose properties is a cwd relative path, and will override the use of other templates)

#### Creating test script templates

The test templates **must** be a [nodejs](https://nodejs.org) module that exports a single function. The function will be provided with parameters from the config file that you can use to populate the file. [k6](https://k6.io) allows provided environment variables from cli, to avoid polluting source code repos with secrets, so use them when needed.

The default template, which uses JS template literals, looks like this:

```js
module.exports = ({method, url, payload, requestParameters}) => `
import http from 'k6/http';
import {check} from 'k6';
import {Rate} from 'k6/metrics';

const user_key = __ENV.USER_KEY;
const method = __ENV.METHOD || '${method}';
const url = \`${url}\`;
const payload = ${payload};
const parameters = ${requestParameters};

const myFailRate = new Rate('failed requests');

export const options = {
  thresholds: {
    'failed requests': [
      {
        threshold: 'rate<0.1',
        abortOnFail: true,
        delayAbortEval: '10s'
      }
    ]
  }
};

export default function() {
  const response = http.request(
    method,
    url,
    payload,
    parameters
  );

  myFailRate.add(response.status !== 200);

  check(response, {
    'status 200': r => r.status === 200,
    // ...other checks
  });
}
`;
```

### Testing

`api-tools test` will use [k6](https://k6.io) to execute a collection of files. You can use `-s,--source` to define a glob pattern which will define which tests to run.

## Want to help?

### TODO

- [ ] allow for compiling of test results from `api-tools test --format file` into better form
- [ ] create addition test script defaults
- [ ] test, test, test!

### Things to note

- `lerna` is used to manage this project as a whole, even though each sub project is it's own repo
- k6 scripts, although written in javascript, are NOT node modules when they are run. If you are using libraries from npm, they must either have 0 dependencies and not use node builtins, or you must first bundle it into a browser-friendly version (i.e. `browserify`, `rollup`, `webpack`, etc.)
