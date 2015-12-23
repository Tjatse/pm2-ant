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

var prefix = chalk.bold.green('[pm2-ant]');

var monitor = Monitor({
  confFile: confFile
});
monitor.run();

var log, logConf = monitor.options.log;
if (logConf) {
  if (!logConf.file) {
    logConf.date = false;
    logConf.prefix = false;
  }
  log = Log(logConf);
}

log.info(chalk.cyan('█▀▀█ █▀▄▀█ █▀█ ░░ █▀▀█ █▀▀▄ ▀▀█▀▀ \n' +
  '█░░█ █░▀░█ ░▄▀ ▀▀ █▄▄█ █░░█ ░░█░░ \n' +
  '█▀▀▀ ▀░░░▀ █▄▄ ░░ ▀░░▀ ▀░░▀ ░░▀░░ \n'));

log.info(prefix, 'The monitor is running.');

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('SIGHUP', restart);

process.on('uncaughtException', function (err) {
  log.error(err.stack);
  shutdown(1);
});

function shutdown(code) {
  log.info(prefix, 'Shutting down pm2-ant....');
  monitor.quit();
  log.info(prefix, 'pm2-emitter and statsd dgram sockets are both closed.');

  log.info(prefix, 'Shutdown complete!');
  process.exit(code || 0);
}

function restart() {
  if (process.send) {
    log.info(prefix, 'Restarting...');
    process.send({
      action: 'restart'
    });
  } else {
    log.error(prefix, 'Could not restart monitor, shutting down.');
    shutdown(1);
  }
}
