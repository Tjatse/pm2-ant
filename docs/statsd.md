# StatsD
- [etsy/statsd](https://github.com/etsy/statsd)

## Installation
- Clone statsd

  ```
  $ git clone https://github.com/etsy/statsd.git
  $ cd statsd
  $ npm install -l
  ```

- Configuration
  Create a config file from exampleConfig.js and put it somewhere.
  ```
  $ cp exampleConfig.js config.js
  $ vi config.js
  ```

- Start the daemon
 
 ```
 $ node stats.js ./config.js
 ```

 [examples/statsd-config.js](examples/statsd-config.js)