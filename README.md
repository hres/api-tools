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

### Testing

`api-tools test` will use [k6](https://k6.io) to execute a collection of files. You can use `-s,--source` to define a glob pattern which will define which tests to run.
