const cli = require('commander');
const which = require('which');
const execa = require('execa');
const chalk = require('chalk');

cli
.name('api-tools test')
.description('Allows for integration, e2e, and performance testing')
.option('-s, --source', 'glob of test files to run')
.option('-f, --format', 'test result output format (default stdout)')
.option('-o, --output', 'output folder for test results (default .)')
.option(
  '-m, --max-throughput',
  'test max throughput for an endpoint (overrides --vus and --duration options)'
)
.option('-v, --vus', 'number of concurrent virtual users (default 1)')
.option('-d, --duration', 'duration of requests (default 1)')
.option('-e, --env', 'supply environment variables to the test scripts')
.option(
  '-t, --threshold',
  'the threshold of failed tests, causing early exit'
)
// .option('-d, --docker', 'use docker to run tests')
.parse(process.argv);

if (!process.argv.slice(2).length) {
  cli.outputHelp();
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
    if (!programExists('k6')) {
      console.log(
        chalk.red(
          'You must have the k6 binary installed to run the tests with k6. You can also try running with docker'
        )
      );
      printDownloadLinks();
      process.exit(1);
    }
    const args = ['k6', 'run'];
    if (cli.vus) args.push('--vus', cli.vus);
    if (cli.duration) args.push('--duration', cli.duration);

    await execa('k6', [
      'run',
      '/home/alex/dev/performance-testing/test/food-{id}.test.js'
    ]).stdout.pipe(process.stdout);
    // }
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
