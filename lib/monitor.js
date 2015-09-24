var fs = require('fs'),
  path = require('path'),
  debug = require('debug')('ant:monitor'),
  _ = require('lodash'),
  pm = require('./pm'),
  conf = require('./util/conf'),
  chalk = require('chalk'),
  pidusage = require('pidusage');

module.exports = Monitor;

/**
 * Monitor of project monitor web.
 * @param options
 * @returns {Monitor}
 * @constructor
 */
function Monitor(options) {
  if (!(this instanceof Monitor)) {
    return new Monitor(options);
  }
  // Initializing...
  this._init(options);
};
Monitor.ACCEPT_KEYS = ['pm2', 'refresh'];
Monitor.DEF_CONF_FILE = 'pm2-ant.ini';

/**
 * Resolve home path.
 * @param {String} pm2Home
 * @returns {*}
 * @private
 */
Monitor.prototype._resolveHome = function (pm2Home) {
  if (pm2Home && pm2Home.indexOf('~/') == 0) {
    // Get root directory of PM2.
    pm2Home = process.env.PM2_HOME || path.resolve(process.env.HOME || process.env.HOMEPATH, pm2Home.substr(2));

    // Make sure exist.
    if (!pm2Home || !fs.existsSync(pm2Home)) {
      throw new Error('PM2 root can not be located, try to initialize PM2 by executing `pm2 ls` or set env by `export PM2_HOME=[ROOT]` in your terminal.');
    }
  }
  return pm2Home;
}

/**
 * Initialize options and configurations.
 * @private
 */
Monitor.prototype._init = function (options) {
  defConf = conf.File(path.resolve(__dirname, '..', Monitor.DEF_CONF_FILE)).loadSync().valueOf();
  defConf = _.pick.call(null, defConf, Monitor.ACCEPT_KEYS);

  options = options || {};
  options = _.pick.apply(options, Monitor.ACCEPT_KEYS).valueOf();
  options = _.defaults(options, defConf);

  options.pm2 = this._resolveHome(options.pm2);

  try {
    defConf = conf.File(path.resolve(options.pm2, Monitor.DEF_CONF_FILE)).loadSync().valueOf();
    defConf = _.pick.call(null, defConf, Monitor.ACCEPT_KEYS);
    options = _.assign(options, defConf);
  } catch (err) {
    debug(chalk.red('can not find `' + Monitor.DEF_CONF_FILE + '`.'))
  }
  // Load PM2 config.
  var pm2ConfPath = path.join(options.pm2, 'conf.js');
  try {
    options.pm2Conf = require(pm2ConfPath)(options.pm2);
    if (!options.pm2Conf) {
      throw new Error(404);
    }
  } catch (err) {
    throw new Error('Can not load PM2 config, the file "' + pm2ConfPath + '" does not exist.');
  }

  // Bind to context.
  this.options = options;
  Object.freeze(this.options);

  // Initialize configurations.
  this._config = conf.File(path.resolve(this.options.pm2, Monitor.DEF_CONF_FILE));

  // Set configurations.
  this.config('pm2', this._resolveHome(this.config('pm2')) || this.options.pm2);
  this.config('refresh', this.config('refresh') || this.options.refresh);
};

/**
 * Operations of configuration.
 * @example:
 *    set config    : mon.config('key', 'value');
 *    clear config  : mon.config('key', null);
 *    get config    : mon.config('key');
 * @param {String} key
 * @param {Mixed} value
 * @returns {*}
 */
Monitor.prototype.config = function (key, value) {
  var def;
  if (value == null) {
    def = defConf[key];
  }
  return this._config.val(key, value, def);
};

Monitor.prototype.run = function () {
  console.log(this.options)
};
