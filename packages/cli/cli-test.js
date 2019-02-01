const {basename} = require('path');
const {stat, mkdirp} = require('fs-extra');
const cli = require('commander');
const which = require('which');
const execa = require('execa');
const chalk = require('chalk');
const globby = require('globby');
const {rootResolve} = require('../../utils');

const DEFAULT_STAGE_LENGTH = '30s';
const DEFAULT_VUES_PER_STAGE = 50;

function splitList(items, token = ',') {
  return items.split(token);
}

function collect(value, collector) {
  collector.push(value);
  return collector;
}

cli
.name('api-tools test')
.description('Allows for integration, e2e, and performance testing')
.option('-s, --source <glob>', 'glob of test files to run')
.option(
  '-o, --outdir <dir>',
  'output folder for test results',
  'test-results/'
)
.option(
  '-f, --format <format>',
  'test result output format [stdout|file]',
  'stdout'
)
.option(
  '-m, --max-throughput',
  `test max throughput for an endpoint (overrides --duration options, steps ramps up by ${DEFAULT_VUES_PER_STAGE} every ${DEFAULT_STAGE_LENGTH} to --vus)`
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
  '-t, --threshold',
  'the threshold of failed tests, causing early exit'
)
// .option('-d, --docker', 'use docker to run tests')
.parse(process.argv);

if (!process.argv.slice(2).length) {
  cli.help();
}

(async() => {
  // if (!(programExists('k6') || programExists('docker'))) {
  //   console.error(
  //     chalk.red(
  //       'You must have either the k6 binary or docker installed to run tests'
  //     )
  //   );
  //   printDownloadLinks();
  //   process.exit(1);
  // }

  try {
    // if (cli.docker) {
    //   if (!programExists('docker')) {
    //     console.log(
    //       chalk.red(
    //         'You must have docker installed to run the tests in a docker container. You can also try running them with the k6 binary'
    //       )
    //     );
    //     printDownloadLinks();
    //     process.exit(1);
    //   }
    //   await execa('docker', [
    //     'run',
    //     '--disable-content-trust',
    //     '-i',
    //     'loadimpact/k6',
    //     'run',
    //     '-',
    //     '</home/alex/dev/performance-testing/test/food-{id}.test.js'
    //   ])
    //   .then(() => console.log('done'))
    //   .catch(err => console.error(err));
    // } else {

    const files = await globby(rootResolve(cli.source));
    if (files.length === 0)
      throw new Error(`${cli.source} did not match any options`);

    if (!programExists('k6')) {
      console.log(
        chalk.red(
          'You must have the k6 binary installed to run the tests with k6'
        )
      );
      printDownloadLinks();
      process.exit(1);
    }
    let options = [];
    if (cli.maxThroughput) {
      options.push('--stage', createStageOption(cli.vus));
    } else {
      if (cli.vus) options.push('--vus', cli.vus);
      if (cli.duration) options.push('--duration', cli.duration);
    }
    cli.env.forEach(value => options.push('--env', value));

    if (cli.format === 'file') {
      try {
        await stat(cli.outdir);
      } catch (_) {
        await mkdirp(cli.outdir);
      }
    }

    for (let i = 0; i < files.length; ++i) {
      const path = files[i];
      console.log(`Running test: ${path}`);
      const args = ['run', ...options, path];
      if (cli.format === 'file') {
        args.push('>', `${cli.outdir}${basename(path).split('.')[0]}.txt`);
      }
      const command = ['k6', ...args].join(' ');
      await execa
      .shell(command, {stdio: 'inherit'})
      .catch(err => console.error(`Error with script ${path}: ${err}`));
    }
  } catch (err) {
    console.error(err);
  }
})();

function programExists(program) {
  return which.sync(program, {nothrow: true});
}

function printDownloadLinks() {
  console.log(chalk.underline('https://docs.k6.io/docs/installation'));
  // console.log(chalk.underline('https://docs.docker.com/install/'));
}

function createStageOption(vus) {
  console.log(vus);
  const numStages = vus / 200;
  if (numStages < 1) {
    throw new Error('Not enough vus to stage, set a higher number with --vus');
  } else {
    let stages = '';
    for (let i = 1; i <= numStages; ++i) {
      stages += `${DEFAULT_STAGE_LENGTH}:${DEFAULT_VUES_PER_STAGE * i},`;
    }
    return stages.substring(0, stages.length - 1);
  }
}
