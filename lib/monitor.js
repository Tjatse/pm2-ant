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
  util = require('util'),
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

// Graphite configs.
// pm2.<node_name>.<app_name>.<pm_id>
Monitor.PREFIX = 'pm2.%s.%s.%d';
Monitor.GRAPHITE_UPTIME = '.uptime';
Monitor.GRAPHITE_PLANNED_RESTART = '.planned_restart_count';
Monitor.GRAPHITE_UNSTABLE_RESTART = '.unstable_restart_count';
// .event.<event_name>
Monitor.GRAPHITE_EVENT = '.event.%s';

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

/**
 * Run monitor.
 * @return {[type]} [description]
 */
Monitor.prototype.run = function () {
  var nodeName = this.options.node,
    waterfalls = [],
    pm2Daemon = this.options.pm2Conf.DAEMON_PUB_PORT,
    statsdUri = url.parse('udp://' + this.options.statsd),
    sock = {
      client: dgram.createSocket('udp4'),
      port: statsdUri.port,
      hostname: statsdUri.hostname
    };

  if (!nodeName) {
    this._getHostName(this._observePM2.bind(null, pm2Daemon, sock));
  } else {
    this._observePM2(pm2Daemon, sock, nodeName);
  }
  debug('The monitor is running now.');
};

/**
 * Get host name by `hostname` cmd.
 * @param  {Function} cb Callback function
 * @return {[type]}      [description]
 */
Monitor.prototype._getHostName = function (cb) {
  exec('hostname', function (err, outprint, errprint) {
    if (err || !outprint) {
      return cb('Unknown');
    }
    return cb(outprint.replace(/\\n/g, ''));
  })
};

/**
 * Observe PM2 events.
 * @param  {String}   pm2Daemon unix socket path of PM2 daemon
 * @param  {SocketClient} sock socket client of statsD
 * @param  {String}   name node name
 * @return {[type]}        [description]
 */
Monitor.prototype._observePM2 = function (pm2Daemon, sock, name) {
  pm.sub(pm2Daemon, function (e) {
    var prefix = util.format(Monitor.PREFIX, name, slug(e.process.name), e.process.pm_id);
    // graphite counter.
    var data = prefix + util.format(Monitor.GRAPHITE_EVENT, e.event) + ':1|c';
    if (e.event == 'exit') {
      // uptime.
      data += '\n' + prefix + Monitor.GRAPHITE_UPTIME + ':' + (e.at - e.process.pm_uptime) + '|ms';
      // planned restarts.
      data += '\n' + prefix + Monitor.GRAPHITE_PLANNED_RESTART + ':' + e.process.restart_time + '|g';
      // unstable restarts.
      data += '\n' + prefix + Monitor.GRAPHITE_UNSTABLE_RESTART + ':' + e.process.unstable_restarts + '|g';
    }
    sock.client.send(data, 0, data.length, sock.port, sock.hostname);
    debug('Sent', data.split(/\n/).join(' '));
  });
};
