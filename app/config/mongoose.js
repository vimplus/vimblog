var mongoose = require('mongoose');
var config = require('./config');

module.exports = function () {
  mongoose.Promise = global.Promise;
  var db = mongoose.connect(config.mongo.url)

  return db;
}
