const debug = require('debug');
const { readFile, writeFile, stat } = require('fs-extra');
const globby = require('globby');
const cli = require('commander');
const { red } = require('chalk');
const { rootResolve } = require('..//utils');

const DEFAULT_RESULTS_FILE = 'results.json';

cli
.name('api-tools test extract')
.description(
  'Extract information from k6 test results. If no output is provided, will output to stdout'
)
.option(
  '-s, --source <glob>',
  'glob of test files to run (must wrap glob patterns in quotes)'
)
.option(
  '-o, --output <dir>',
  'file to save the results to',
  DEFAULT_RESULTS_FILE
)
.option('-F, --force', 'force overwriting of output file')
.parse(process.argv);

(async() => {
  try {
    const paths = await globby(rootResolve(cli.source));
    if (paths.length === 0)
      throw new Error(`${cli.source} did not match any files`);

    const results = await Promise.all(
      paths.map(async path => {
        try {
          const file = await readFile(path, 'utf8');
          const iterations = file.match(/iterations\.+: (\d*)/)[1];
          const failures = file.match(/checks.*✗ (\d*)/)[1];
          return {
            testFile: path,
            ratio: `${((iterations - failures) / iterations) * 100}%`,
            iterations,
            failures,
            vus: file.match(/vus: (.*),/)[1],
            duration: file.match(/duration: (.*),/)[1],
            timings: {
              avg: file.match(/iteration_duration.*avg=([\w.]*)/)[1],
              min: file.match(/iteration_duration.*min=([\w.]*)/)[1],
              max: file.match(/iteration_duration.*max=([\w.]*)/)[1],
              p90: file.match(/iteration_duration.*p\(90\)=([\w.]*)/)[1],
              p95: file.match(/iteration_duration.*p\(95\)=([\w.]*)/)[1]
            }
          };
        }
        catch (_) {
          console.error(red(`Could not read ${path}`));
        }
      })
    );

    results.sort((a, b) => (a.testFile < b.testFile ? -1 : 1));

    if (cli.output) {
      const output = rootResolve(cli.output);
      try {
        await stat(output);
        if (!cli.force) {
          console.error(
            red('Path already exists, use -F/--force to force override')
          );
          process.exit(1);
        }
      }
      catch (_) {
        //fine, doesn't exist
      }

      try {
        await writeFile(output, JSON.stringify(results));
      }
      catch (_) {
        console.error(red(`Could not write file to ${output}`));
      }
    }
    else {
      console.log(JSON.stringify(results));
    }
  }
  catch (err) {
    debug(err);
  }
})();
