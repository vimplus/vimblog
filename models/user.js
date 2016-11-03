var exception = require('../libs/exception');

exports.save = function (mongo, doc) {
  return function (callback) {
    mongo
      .db('vimblog')
      .collection('users')
      .insert(doc, function (err, res) {
        if (err) return callback(exception(exception.DBError, err.message));
        callback(null, res);
      })
  }
}

exports.get = function (mongo, name) {
  return function (callback) {
    mongo
      .db('vimblog')
      .collection('users')
      .findOne({"name": name}, function (err, res) {
        if (err) return callback(exception(exception.DBError, err.message));
        callback(null, res);
      })
  }
}
