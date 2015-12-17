var Monitor = require('./lib/monitor'),
  chalk = require('chalk'),
  path = require('path'),
  fs = require('fs'),
  pkg = require('./package.json'),
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

if (!process.send) {
  console.log(chalk.cyan('pm2-ant v' + pkg.version + '\n' + 
    'The MIT License (MIT)\n' + 
    'Copyright (c) Tjatse <thisnamemeansnothing@gmail.com>\n' + 
    'This program comes with ABSOLUTELY NO WARRANTY.\n' + 
    'This is free software, and you are welcome to redistribute it under certain conditions.\n'));
}

var prefix = chalk.bold.green('[pm2-ant]');

var monitor = Monitor({
  confFile: confFile
});
monitor.run();

console.log(prefix, 'The monitor is running.');

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('SIGHUP', restart);

process.on('uncaughtException', function (err) {
  console.error(err.stack);
  shutdown(1);
});

function shutdown(code) {
  console.log(prefix, 'Shutting down pm2-ant....');
  monitor.quit();
  console.log(prefix, 'pm2-emitter and statsd dgram sockets are both closed.');

  console.log(prefix, 'Shutdown complete!');
  process.exit(code || 0);
}

function restart() {
  if (process.send) {
    console.log(prefix, 'Restarting...');
    process.send({
      action: 'restart'
    });
  } else {
    console.error(prefix, 'Could not restart monitor, shutting down.');
    shutdown(1);
  }
}
