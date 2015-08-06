# pm2-ant
Unitech/PM2 performance monioring using Statsd and Graphite

> I am still working on this - trying to demerge it from the products.

## Why this?
I'm using PM2 to run thousands applications on dozens of servers, the performance of PM2 (maybe applications) is hard to track on production environment, e.g.:
- Restart, stop, start events of PM2
- CPU & Memory usages
- I/O frequency
- Network latency (Request / Response times, Apdex stuffs)
- Triggers (restart / stop warning - SMS / Email)

## How it works

![flows](screenshots/flows.jpg)