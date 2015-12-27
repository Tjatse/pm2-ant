# pm2-ant
Unitech/PM2 performance monioring using Statsd and Graphite

> I am still working on this - trying to demerge it from the products.

# Installation
```bash
$ npm install pm2-ant --production
$ cd node_modules/pm2-ant
# or
$ git clone https://github.com/Tjatse/pm2-ant.git
$ cd pm2-ant
$ npm install --production
```

## Why this?
I'm using PM2 to run thousands applications on dozens of servers, the performance of PM2 (maybe applications) is hard to track on production environment, e.g.:
- [x] Restart, stop, start events of PM2
- [x] CPU & Memory usages (collectd)
- [ ] I/O frequency
- [ ] Network latency (Request / Response times, Apdex stuffs)
- [ ] Triggers (restart / stop warning - SMS / Email)

## How it works

![flows](imgs/flows.jpg)

## Requirement
- [Graphite](docs/graphite.md)
- [StatsD](docs/statsd.md)
- [collectd](docs/collectd.md) *(optional)*

## Usage
When the carbon and statsd are both running, just edit the `pm2-ant.ini` file to make everything goes fine, then use the following commands to get usage helps:
```bash
$ ./pm2-ant
```

Directly:
```bash
$ node pm2-ant.js
```

Programmable:
```javascript
var pm2Ant = require('pm2-ant');
pm2Ant.start([options]);
```

## View Matrices
Now you can view matrices with [Grafana](http://docs.grafana.org/installation/rpm/).

![flows](imgs/grafana.jpg)

statsD path:
```
stats.gauges.pm2.<node_name>.<app_name>.planned_restart_count
stats.gauges.pm2.<node_name>.<app_name>.<pm_id>.planned_restart_count
stats.gauges.pm2.<node_name>.<app_name>.unstable_restart_count
stats.gauges.pm2.<node_name>.<app_name>.<pm_id>.unstable_restart_count
stats.pm2.<node_name>.<app_name>.event.<event_name>
stats.pm2.<node_name>.<app_name>.<pm_id>.event.<event_name>
stats.timers.pm2.<node_name>.<app_name>.uptime
stats.timers.pm2.<node_name>.<app_name>.<pm_id>.uptime
```

## Configuration
`./pm2-ant.ini` defaults:
```ini
node = LocalPM2
pm2 = ~/.pm2
refresh = 5000
statsd = 127.0.0.1:8125
daemonize = true

[log]
dir = ./logs
prefix = true
date = false
level = debug
```

## License
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
