var util = require('util'),
  fs = require('fs'),
  path = require('path'),
  _ = require('lodash'),
  chalk = require('chalk');

exports = module.exports = Log;

function Log(options) {
  if (!(this instanceof Log)) {
    return new Log(options);
  }
  options = options || {};
  if (_.isString(options.level) && _.isNaN(options.level = Log._LEVELS.indexOf(options.level))) {
    delete options.level;
  }
  if (isNaN(options.level) || !(options.level >= 0 && options.level <= Log._LEVELS.length)) {
    delete options.level
  }
  if (_.isUndefined(options.level)) {
    options.level = Log.INFO;
  }

  if (_.isString(options.file)) {
    var p = path.resolve(process.cwd(), options.file);
    p = path.dirname(p);
    if (!fs.existsSync(p)) {
      try {
        fs.mkdirSync(p)
      } catch (err) {
        throw new Error('Directory ' + p + ' does not exist, and failed to create.');
      }
    }
    this.stream = fs.createWriteStream(options.file);
  }
  this.options = options;
}

Log.prototype._log = function () {
  var op = this.options,
    args = Array.prototype.slice.call(arguments),
    params = args.splice(0, 1)[0];

  if (params.level < op.level) {
    return;
  }
  var msg = '';
  if (_.isBoolean(params.prefix) ? params.prefix : op.prefix) {
    msg += chalk.bold[Log._LEVEL_COLORS[params.level]]('[' + Log._LEVELS[params.level] + ']') + ' ';
  }
  if (_.isBoolean(params.date) ? params.date : op.date) {
    msg += chalk.grey((new Date()).toLocaleString()) + ' ';
  }

  msg += util.format.apply(null, args);

  if (_.isBoolean(params.color) ? params.color : !op.color) {
    msg = chalk.stripColor(msg);
  }

  if (op.file) {
    this.stream.write(msg + '\n');
  }

  if (!op.file || op.console) {
    console.log(msg);
  }
};

Log._LEVELS = ['NOTSET', 'DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];
Log._LEVEL_COLORS = ['black', 'grey', 'green', 'yellow', 'red', 'magenta'];

Log._LEVELS.forEach(function (lev, ind) {
  Log[lev] = ind;

  if (lev == 'NOSET') {
    return;
  }
  Log.prototype[lev.toLowerCase()] = function () {
    var args = Array.prototype.slice.call(arguments);
    args.splice(0, 0, {
      level: ind
    });
    this._log.apply(this, args);
  };
});
