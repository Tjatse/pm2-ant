var Monitor = require('./lib/monitor'),
  chalk = require('chalk'),
  path = require('path'),
  fs = require('fs'),
  debug = require('debug')('ant:monitor');

var confFile = './pm2-ant.ini';
if (process.argv.length > 2) {
  var confFile = process.argv[2];
}
confFile = path.resolve(__dirname, confFile);

if (!fs.existsSync(confFile)) {
  console.log(chalk.bgRed.white('ERROR'), chalk.bold(confFile), 'does not exist!');
  return process.exit(0);
}

debug('by configured file ' + confFile);

Monitor({
  confFile: confFile
}).run();
