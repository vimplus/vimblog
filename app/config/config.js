'use strict';
module.exports = {
  port: 3060,
  keys: ['vimblog'],
  host: '127.0.0.1',
  cookieSecret: 'vimblog',
  mongo: {
    db: 'vimblog',
    host: '127.0.0.1',
    port: 27017,
    url: 'mongodb://127.0.0.1/vimblog'
  }
}
