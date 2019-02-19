const { basename } = require('path');
const { stat, mkdirp } = require('fs-extra');
const cli = require('commander');
const which = require('which');
const execa = require('execa');
const { red, underline } = require('chalk');
const globby = require('globby');
const { addTrailingSlash, rootResolve, sleep } = require('@api-tools/utils');

const DEFAULT_STAGE_LENGTH = '30s';
const DEFAULT_VUES_PER_STAGE = 50;
const COOL_DOWN_SECONDS = 10;

function collect(value, collector = []) {
  collector.push(value);
  return collector;
}

cli
.name('api-tools test')
.description('Allows for integration, e2e, and performance testing')
.option(
  '-s, --source <glob>',
  'glob of test files to run (must wrap glob patterns in quotes)'
)
.option('-c, --config <file>', 'provide k6 config file')
.option(
  '-o, --outdir <dir>',
  'output folder for test results',
  addTrailingSlash,
  'test-results/'
)
.option(
  '-f, --format <format>',
  'test result output format [stdout|file]',
  'stdout'
)
.option(
  '-v, --vus <number>',
  'number of concurrent virtual users (default: 1)'
)
.option('-d, --duration <time>', 'duration of requests (default: 1s)')
.option(
  '-e, --env <envVars>',
  'supply environment variables to the test scripts (e.g. USER_KEYs)',
  collect,
  []
)
.option(
  '-m, --max-throughput <vus>',
  `test max throughput for an endpoint (overrides --duration options, steps up by ${DEFAULT_VUES_PER_STAGE} every ${DEFAULT_STAGE_LENGTH} to 'vus' amount)`
)
.option('-a, --average <n>', 'run \'n\' iterations and get the average')
.option(
  '-k, --k6-options',
  'define k6 cli options as a string (will be applied last so will override other settings)'
)
.option('-F, --force', 'forces overwriting of results when using format=file')
.parse(process.argv);

if (!process.argv.slice(2).length) {
  cli.help();
}

(async() => {
  try {
    const files = (await globby([rootResolve(cli.source)])).sort();
    if (files.length === 0)
      throw new Error(`${cli.source} did not match any options`);

    if (!programExists('k6')) {
      console.log(
        red('You must have the k6 binary installed to run the tests with k6')
      );
      printDownloadLinks();
      process.exit(1);
    }
    let options = [];

    // put config first, allow cli args to override
    if (cli.config) {
      options.push('--config', cli.config);
    }

    // special 'max' and 'avg' flags for easier use
    if (cli.maxThroughput) {
      options.push('--stage', createStageOption(cli.maxThroughput));
    }
    else if (cli.average) {
      options.push('--iterations', cli.average);
    }

    // include other options as needed
    else {
      if (cli.vus) options.push('--vus', cli.vus);
      if (cli.duration) options.push('--duration', cli.duration);
    }
    cli.env.forEach(value => options.push('--env', value));

    // apply the string of k6 options last
    if (cli.k6Options) {
      options.push(cli.k6Options.split(' '));
    }

    if (cli.format === 'file') {
      try {
        await stat(cli.outdir);
      }
      catch (_) {
        await mkdirp(cli.outdir);
      }
    }

    for (let i = 0; i < files.length; ++i) {
      const path = files[i];
      console.log(`Running test: ${path}`);
      const args = ['run', ...options, path];
      const outputPath = `${cli.outdir}${basename(path).split('.')[0]}.txt`;
      if (cli.format === 'file') {
        try {
          await stat(outputPath);
          if (cli.force) {
            args.push('>', outputPath);
          }
          else {
            console.error(
              red(
                `Output path ${outputPath} already exists, use -F,--force to force overwriting`
              )
            );
            process.exit(1);
          }
        }
        catch (_) {
          args.push('>', outputPath);
        }
      }
      const command = ['k6', ...args].join(' ');
      await execa
      .shell(command, { stdio: 'inherit' })
      .catch(err => console.error(`Error with script ${path}: ${err}`));

      // let it cool down
      console.log(`Test finished, cooling down for ${COOL_DOWN_SECONDS}s`);
      await sleep(COOL_DOWN_SECONDS * 1000);
      console.log('Done');
    }
  }
  catch (err) {
    console.error(err);
  }
})();

function programExists(program) {
  return which.sync(program, { nothrow: true });
}

function printDownloadLinks() {
  console.log(underline('https://docs.k6.io/docs/installation'));
}

function createStageOption(vus) {
  console.log(vus);
  const numStages = vus / DEFAULT_VUES_PER_STAGE;
  if (numStages < 1) {
    throw new Error('Not enough vus to stage, set a higher number with --vus');
  }
  else {
    let stages = '';
    for (let i = 1; i <= numStages; ++i) {
      stages += `${DEFAULT_STAGE_LENGTH}:${DEFAULT_VUES_PER_STAGE * i},`;
    }
    return stages.substring(0, stages.length - 1);
  }
}
