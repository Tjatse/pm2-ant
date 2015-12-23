var Monitor = require('./lib/monitor'),
  chalk = require('chalk'),
  path = require('path'),
  fs = require('fs'),
  pkg = require('./package.json'),
  Log = require('./lib/util/log');

var confFile = './pm2-ant.ini';
if (process.argv.length > 2) {
  var confFile = process.argv[2];
}
confFile = path.resolve(__dirname, confFile);

if (!fs.existsSync(confFile)) {
  console.log(chalk.bgRed.white('ERROR'), chalk.bold(confFile), 'does not exist!');
  return process.exit(0);
}

var monitor = Monitor({
  confFile: confFile
});

var log, logConf = monitor.options.log;
if (logConf) {
  if (!logConf.file) {
    logConf.date = false;
    logConf.prefix = false;
  }
  log = Log(logConf);
}

log._log({
  level: Log.INFO,
  date: false,
  prefix: false
}, chalk.cyan(
  '\n' +
  '█▀▀█ █▀▄▀█ █▀█ ░░ █▀▀█ █▀▀▄ ▀▀█▀▀ \n' +
  '█░░█ █░▀░█ ░▄▀ ▀▀ █▄▄█ █░░█ ░░█░░ \n' +
  '█▀▀▀ ▀░░░▀ █▄▄ ░░ ▀░░▀ ▀░░▀ ░░▀░░ \n'));


monitor.setLogger(log);
monitor.run();

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('SIGHUP', restart);
process.on('uncaughtException', caughtException);

function shutdown(code) {
  log.info('Shutting down....');
  monitor.quit();
  log.info('Both', chalk.bold('pm2-emitter'), 'and', chalk.bold('statsd dgram'), 'sockets are closed.');
  log.info('Shutdown complete!');
  exitGraceful(code);
}

function restart() {
  log.info('Restarting...');
  if (process.send) {
    process.send({
      action: 'restart'
    });
  } else {
    log.error('Could not restart monitor, shutting down.');
    shutdown(1);
  }
}

function caughtException(err) {
  log.error(err.stack);
  shutdown(1);
}

function exitGraceful(code) {
  code = code || 0;
  log.stream.write(' ', function () {
    process.exit(code);
  });
}
