var util = require('util'),
  fs = require('fs'),
  chalk = require('chalk');

exports = module.exports = Log;

function Log(options) {
  if (!(this instanceof Log)) {
    return new Log(options);
  }
  options = options || {};

  if (typeof options.level == 'string' && !(options.level = Log[options.level])) {
    delete options.level;
  }
  if (isNaN(options.level) || !(options.level >= 0 && options.level <= Log._LEVELS.length)) {
    delete options.level
  }
  if (typeof options.level == 'undefined') {
    options.level = Log.INFO;
  }

  if (options.file) {
    options.file = fs.createWriteStream(options.file);
  }
  this.options = options;
}

Log.prototype._log = function (level, args) {
  var op = this.options;
  if (level < op.level) {
    return;
  }
  var msg = (!op.prefix ? '' : '[' + Log._LEVELS[level] + '] ') + (op.date ? (new Date()).toLocaleString() + ' - ' : '') + util.format.apply(null, args);
  if (!op.color) {
    msg = chalk.stripColor(msg);
  }

  if (op.file) {
    op.file.write(msg + '\n');
  } else {
    console.log(msg);
  }
};

Log._LEVELS = ['NOTSET', 'DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];

Log._LEVELS.forEach(function (lev, ind) {
  Log[lev] = ind;

  if (lev == 'NOSET') {
    return;
  }
  Log.prototype[lev.toLowerCase()] = function () {
    this._log(ind, arguments);
  };
});
