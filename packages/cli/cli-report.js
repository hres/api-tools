const debug = require('debug');
const { readFile } = require('fs-extra');
const globby = require('globby');
const cli = require('commander');
const { red } = require('chalk');
const { rootResolve } = require('@api-tools/utils');

cli
.name('api-tools test extract')
.description('Extract information from k6 test results')
.option(
  '-s, --source <glob>',
  'glob of test files to run (must wrap glob patterns in quotes)'
)
.parse(process.argv);

(async() => {
  try {
    const files = await globby(rootResolve(cli.source));
    if (files.length === 0)
      throw new Error(`${cli.source} did not match any files`);

    const results = [];

    for (let i = 0; i < files.length; ++i) {
      const path = files[i];
      try {
        const file = await readFile(path, 'utf8');
        const iterations = file.match(/iterations\.+: (\d*)/)[1];
        const failures = file.match(/checks.*✗ (\d*)/)[1];
        results.push({
          test: path,
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
        });
      }
      catch (_) {
        console.error(red(`Could not read ${path}`));
      }
    }

    console.log(results.sort(result => result.test));
  }
  catch (err) {
    debug(err);
  }
})();
