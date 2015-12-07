var fs = require('fs'),
  path = require('path'),
  debug = require('debug')('ant:monitor'),
  exec = require('child_process').exec,
  _ = require('lodash'),
  pm = require('./pm'),
  conf = require('./util/conf'),
  dgram = require('dgram'),
  async = require('async'),
  slug = require('limax'),
  url = require('url'),
  chalk = require('chalk');

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
Monitor.ACCEPT_KEYS = ['pm2', 'refresh', 'statsd', 'node'];
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
  defConf = conf.File(options.confFile || path.resolve(__dirname, '..', Monitor.DEF_CONF_FILE)).loadSync().valueOf();
  defConf = _.pick.call(null, defConf, Monitor.ACCEPT_KEYS);

  options = options || {};
  options = _.pick.apply(options, Monitor.ACCEPT_KEYS).valueOf();
  options = _.defaults(options, defConf);

  options.pm2 = this._resolveHome(options.pm2);

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
};

Monitor.prototype.run = function () {
  var nodeName = this.options.node,
    waterfalls = [],
    sock = dgram.createSocket('udp4'),
    statsdUri = url.parse('udp://' + this.options.statsd),
    statsdHostName = statsdUri.hostname,
    statsdPort = statsdUri.port;

  if (!nodeName) {
    waterfalls.push(function (next) {
      this._getHostName(function (name) {
        next(null, name);
      });
    }.bind(this));
  } else {
    waterfalls.push(function (next) {
      next(null, nodeName);
    });
  }
  waterfalls.push(function (name, next) {
    pm.sub(this.options.pm2Conf.DAEMON_PUB_PORT, function (e) {
      var prefix = 'pm2.' + name + '.' + slug(e.process.name) + '-' + e.process.pm_id + '.';
      var data = prefix + e.event + ':1|c';
      if (e.event == 'exit') {
        var uptime = e.at - e.process.pm_uptime;
        data += '\n' + prefix + 'uptime:' + uptime + '|ms';
      }
      sock.send(data, 0, data.length, statsdPort, statsdHostName);
      debug('sent', data);
    });
  }.bind(this));

  async.waterfall(waterfalls, function (err, res) {
    debug('running now.');
  })
};

Monitor.prototype._getHostName = function (cb) {
  exec('hostname', function (err, outprint, errprint) {
    if (err || !outprint) {
      return cb('Unknown');
    }
    return cb(outprint.replace(/\\n/g, ''));
  })
};
