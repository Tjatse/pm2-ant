var spawn = require('child_process').spawn,
  fs = require('fs'),
  path = require('path'),
  _ = require('lodash'),
  async = require('async'),
  rpc = require('pm2-axon-rpc'),
  axon = require('pm2-axon'),
  debug = require('debug')('ant:pm');

/**
 * Forever lib.
 * @type {{}}
 */
var pm = module.exports = {};

var re_blank = /^[\s\r\t]*$/,
  allowedEvents = ['start', 'restart', 'exit', 'online'];

/**
 * Subscribe event BUS.
 * @param {String} sockPath
 * @param {Function} cb
 */
pm.sub = function (sockPath, cb) {
  var sub = axon.socket('sub-emitter');
  sub.connect(sockPath);

  // Process events.
  sub.on('process:*', function (e, d) {
    if (d && !!~allowedEvents.indexOf(d.event)) {
      cb(d);
    }
  });
};

/**
 * List available processes.
 * @param {String} sockPath
 * @param {Function} cb
 */
pm.list = function (sockPath, cb) {
  if (!fs.existsSync(sockPath)) {
    return cb(null, []);
  }
  pm._rpc({
    sockPath: sockPath,
    events: [
      ['getMonitorData', {}, cb]
    ]
  });
};

/**
 * Execute remote RPC events.
 * @param {Object} opts including:
 *  {String} sockPath
 *  {Object} args
 *  {Object} events
 *    key: event name
 *    value: callback function
 * @private
 */
pm._rpc = function (opts) {
  var req = axon.socket("req"),
    rpc_sock = req.connect(opts.sockPath),
    rpc_client = new rpc.Client(req);

  // Connect RPC server.
  rpc_sock.on('connect', function () {
    // Execute request.
    var waterfalls = opts.events.map(function (event) {
      return function (next) {
        var cb = typeof event[event.length - 1] == 'function' ? event.pop() : null;
        if (cb) {
          event.push(function () {
            // Wrap arguments, no [].slice (avoid leak)!!!
            var args = new Array(arguments.length);
            for (var i = 0; i < args; i++) {
              args[i] = arguments[i];
            }
            cb.apply(null, arguments);
            next();
          });
        }
        rpc_client.call.apply(rpc_client, event);
        if (!cb) {
          next();
        }
      };
    });
    async.waterfall(waterfalls, function (err, res) {
      rpc_sock.close();
    });
  });
};

/**
 * Find process by pm_id.
 * @param {String} sockPath
 * @param {String} id
 * @param {Function} cb
 * @private
 */
pm._findById = function (sockPath, id, cb) {
  pm.list(sockPath, function (err, procs) {
    if (err) {
      return cb(err);
    }
    if (!procs || procs.length == 0) {
      return cb(new Error('No PM2 process running, the sockPath is "' + sockPath + '", please make sure it is existing!'));
    }

    var proc = _.find(procs, function (p) {
      return p && p.pm_id == id;
    });

    if (!proc) {
      return cb(new Error('Cannot find pm process by pm_id: ' + id));
    }

    cb(null, proc);
  }, true);
}

/**
 * Trigger actions of process by pm_id.
 * @param {String} sockPath
 * @param {String} id
 * @param {Function} cb
 */
pm.action = function (sockPath, action, id, cb) {
  if (id == 'all') {
    pm.list(sockPath, function (err, procs) {
      if (err) {
        return cb(err);
      }
      if (!procs || procs.length == 0) {
        return cb(new Error('No PM2 process running, the sockPath is "' + sockPath + '", please make sure it is existing!'));
      }

      async.map(procs, function (proc, next) {
        pm._actionByPMId(sockPath, proc, action, next.bind(null, null));
      }, cb);
    });
  } else {
    pm._findById(sockPath, id, function (err, proc) {
      if (err) {
        return cb(err);
      }
      pm._actionByPMId(sockPath, proc, action, cb);
    });
  }
};

/**
 * Trigger actions of process by pm_id.
 * @param {String} sockPath
 * @param {Object} proc
 * @param {String} action
 * @param {Function} cb
 * @private
 */
pm._actionByPMId = function (sockPath, proc, action, cb) {
  var noBusEvent = action == 'delete' && proc.pm2_env.status != 'online',
    pm_id = proc.pm_id;

  action += 'ProcessId';
  var watchEvent = ['stopWatch', action, {
    id: pm_id
  }, function (err, success) {}];

  if (!!~['restart'].indexOf(action)) {
    watchEvent.splice(0, 1, 'restartWatch');
    watchEvent.pop();
  }

  var actionEvent = [action, pm_id, function (err, sock) {
    cb(err, noBusEvent);
  }];

  if (action == 'restartProcessId') {
    actionEvent.splice(1, 1, {
      id: pm_id
    });
  }

  pm._rpc({
    sockPath: sockPath,
    events: [
      watchEvent,
      actionEvent
    ]
  });
};
