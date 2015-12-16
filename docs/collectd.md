# collectd
Just using [collectd/collectd](https://github.com/collectd/collectd) to gather statistics about the system it is running on and store the informations into whisper.

## Installation

### Macintosh

```
$ brew install collectd
```

[For version 5.1 and later using the Write Graphite plugin is highly recommended.](https://collectd.org/wiki/index.php/Plugin:Carbon)

Modify the config file `/usr/local/Cellar/collectd/5.5.0/etc/collectd.conf` to enable `write_graphite` plugin:

```
LoadPlugin write_graphite

<Plugin write_graphite>
  <Node "example">
    Host "127.0.0.1"
    Port "2003"
    Protocol "tcp"
    LogSendErrors true
    Prefix "pm2."
    Postfix ""
    StoreRates true
    AlwaysAppendDS false
    EscapeCharacter "_"
  </Node>
</Plugin>
```

Then start collectd service:

```
$ /usr/local/Cellar/collectd/5.5.0/sbin/collectd
```

### Linux distributions
[https://collectd.org/download.shtml](https://collectd.org/download.shtml)
