# Graphite
- [Official Document](http://graphite.readthedocs.org/en/latest/)
- [Quickstart Guide](http://graphite.wikidot.com/quickstart-guide)

## Installation

```bash
$ wget https://raw.githubusercontent.com/graphite-project/graphite-web/master/requirements.txt
$ pip install -r requirements.txt 
$ pip install https://github.com/graphite-project/ceres/tarball/master
$ pip install whisper carbon graphite-web
```

**References**
- [CFFI](http://cffi.readthedocs.org/en/latest/installation.html#platform-specific-instructions)
- [cairo](http://cairographics.org/download/)
- [cairocffi](https://pypi.python.org/pypi/cairocffi)

## Configuration

```bash
$ cd /opt/graphite/conf/
$ cp carbon.conf.example carbon.conf
$ cp storage-schemas.conf.example storage-schemas.conf
$ cp graphite.wsgi.example graphite.wsgi
$ cd /opt/graphite/webapp/graphite/
$ cp local_settings.py.example local_settings.py
```

storage-schemas.conf
```
[pm2]
pattern = \.pm2\.
retentions = 1h:6h,2h:1d
```

**References**
- [carbon.conf](http://graphite.readthedocs.org/en/latest/config-carbon.html#carbon-conf)
- [storage-schemas.conf](http://graphite.readthedocs.org/en/latest/config-carbon.html#storage-schemas-conf)
- [Graphite-web’s local_settings.py](http://graphite.readthedocs.org/en/latest/config-local-settings.html)

## Initialize the database

```bash
$ python /opt/graphite/webapp/graphite/manage.py syncdb
```

## Start data collection daemon
By default, carbon-cache.py will start a listener on port 2003 that will wait for data to be submitted.

```bash
$ /opt/graphite/bin/carbon-cache.py start
```

**References**
[carbon](http://graphite.readthedocs.org/en/latest/admin-carbon.html)

## Run the graphite web interface under the django development server (not necessary)

```bash
$ /opt/graphite/bin/run-graphite-devel-server.py --libs=/opt/graphite/webapp/ /opt/graphite/
```

## Probably problems

- *Mac OS X*

  Required **XCode and Command Line Tools**

- *TypeError: fetch() takes at most 3 arguments (4 given)*

  Mostly, your eggs are not matching the requirements.txt, try to uninstall them and reinstall again by `$ pip install -r requirements.txt`.

- *Package libffi was not found in the pkg-config search path. Perhaps you should add the directory containing `libffi.pc' to the PKG_CONFIG_PATH environment variable No package 'libffi' found*

  ```bash
  $ yum install libffi-devel.x86_64
  $ export PKG_CONFIG_PATH=/usr/lib64/pkgconfig/
  ```

- *_cffi_backend.c:2:20: fatal error: Python.h: No such file or directory*

  ```bash
  $ yum install python-devel.x86_64
  ```
