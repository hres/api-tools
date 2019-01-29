# API Tools

A collection of tools to help with building GoC compliant API's, including:

- openapi documentation editor
- performance testing

## Usage

### Node

### Docker

### CLI

NOTE: for vscode typescript linting, install the `TypeScript TSLint Plugin` extension (remove the `TSLint` extension if you already have it installed). The plugin works requires a global or local install of tslint. It by default works with the version of ts built into vscode, so doesn't need a tsconfig file to work. If you want to use a different version of ts, or if you are using tslint locally, you need to install `typescript` and include the plugin in the projects' tsconfig file with this as a minimum

```json
{
  "compilerOptions": {
    "plugins": [{"name": "typescript-tslint-plugin"}]
  }
}
```
