var marked = require('marked');
var moment = require('moment');
var gravatar = require('gravatar');
var ObjectID = require('mongodb').ObjectID;

var exception = require('../libs/exception');

//保存文章
exports.save = function (mongo, user, data) {
  var tags = {};
  data.tags.forEach(function (tag) {
    if (tag) tags[tag.toLowerCase()] = 1;
  });

  return function (callback) {
    var article = {
      name: this.name,
      avatar: this.avatar,
      time: time,
      title: this.title,
      tags: this.tags,
      content: this.content,
      comments: [],
      reprintInfo: {},
      pageview: 0
    }

    mongo
      .db('vimblog')
      .collection('articles')
      .insert(article, function (err, res) {
        if (err) {
          return callback(exception(exception.DBError, err.message));
        }
        callback(null, res);
      })

  }
}
//获取文章列表
exports.getList = function (mongo, name, page) {
  var query = {};
  if (name) {
    query.name = name;
  }
  return function (callback) {
    mongo
      .db('vimblog')
      .collection('articles')
      .find(query)
      .sort({time: -1})
      .skip((page - 1) * 10)
      .limit(10)
      .toArray(function (err, list) {
        if (err) return callback(exception(exception.DBError, err, err.message));

        list.forEach(function (doc) {
          doc.content = marked(doc.content);
          doc.time = moment(doc.time).format('YYYY-MM-DD HH:mm');
          doc.comments.forEach(function (comment) {
            comment.time = moment(comment.time).format('YYYY-MM-DD HH:mm');
          })
          callback(null, list);
        })
      })
  }
}
//统计文章总数
exports.count = function (mongo, name) {
  var query = {};
  if (name) query.name = name;
  return function (callback) {
    mongo
      .db('vimblog')
      .collection('articles')
      .count(query, function (err, res) {
        if (err) return callback(exception(exception.DBError, err.message));
        callback(null, res)
      })
  }
}
//获取归档文章
exports.getArchive = function (mongo) {
  return function (callback) {
    mongo
      .db('vimblog')
      .collection('articles')
      .find({}, {"time": 1, "title": 1})
      .sort({time: -1})
      .toArray(function (err, list) {
        if (err) return callback(exception(exception.DBError, err.message));
        list.forEach(function (doc) {
          doc.time = moment(doc.time).format('YYYY-MM-DD');
        });
        callback(null, list);
      })
  }
}
//获取所有的标签
exports.getTags = function (mongo) {
  return function (callback) {
    mongo
      .db('vimblog')
      .collection('articles')
      .distinct("tags", function (err, res) {
        if (err) return callback(exception(exception.DBError, err.message));
        callback(null, res);
      })
  }
}
//根据标签获取所有的文章
exports.getTag = function (mongo, tag) {
  return function (callback) {
    mongo
      .db('vimblog')
      .collection('articles')
      .find({"tags": tag}, {"title": 1, "time": 1})
      .toArray(function (err, list) {
        if (err) return callback(exception(exception.DBError, err.message));
        list.forEach(function (doc) {
          doc.time = moment(doc.time).format('YYYY-MM-DD');
        })
        callback(null, list);
      })
  }
}
//搜索
exports.search = function (mongo, keyword) {
  var pattern = new RegExp(keyword, "i");
  return function (callback) {
    mongo
      .db('vimblog')
      .collection('articles')
      .find({"title": pattern}, {"time": 1, "title": 1})
      .toArray(function (err, list) {
        if (err) return callback(exception(exception.DBError, err.message));
        list.forEach(function (doc) {
          doc.time = moment(doc.time).format('YYYY-MM-DD');
        })
        callback(null, list);
      })
  }
}
//通过id查询一篇文章
exports.findById = function (mongo, id) {
  return function (callback) {
    mongo
      .db('vimblog')
      .collection('articles')
      .findAndModify({"_id": new ObjectID(id)}, [], {"$inc": {pageview: 1}}, {new: true}, function (err, doc) {
        if (err) return callback(exception(exception.DBError, err.message));
        if (!doc) return callback(exception(exception.NotFound, 'NotFound' + id));
        doc.content = marked(doc.content);
        doc.time = moment(doc.time).format('YYYY-MM-DD HH:mm:ss');
        doc.comments.forEach(function (comment) {
          comment.content = marked(comment.content);
          comment.time = moment(comment.time).format('YYYY-MM-DD HH:mm:ss');
        })
        callback(null, doc);
      })
  }
}
//提交评论
exports.commentById = function (mongo, id, newComment) {
  return function (id) {
    mongo
      .db('vimblog')
      .collection('articles')
      .update({"_id": new ObjectID(id)}, {"$push": {"comments": newComment}}, function (err, res) {
        if (err) return callback(exception(exception.DBError, err.message));
        if (!res) return callback(exception(exception.NotFound, 'NotFound' + id));
        callback(null, res);
      })
  }
}
//获取文章的markdown原始格式内容，用于编辑
exports.getRawOne = function (mongo, id, name) {
  return function (callback) {
    mongo
      .db('vimblog')
      .collection('articles')
      .findOne({"_id": new ObjectID(id), "name": name}, function (err, res) {
        if (err) return callback(exception(exception.DBError, err.message));
        if (!res) return callback(exception(exception.NotFound, 'NotFound' + id));
        callback(null, res);
      })
  }
}
//更新文章
exports.update = function (mongo, id, name, doc) {
  var tags = {}
  doc.tags.forEach(function (tag) {
    if (tag) tags[tag.toLowerCase()] = 1;
  })
  doc.tags = Object.keys(tags);
  return function (callback) {
    mongo
      .db('vimblog')
      .collection('articles')
      .update({"_id": new ObjectID(id), "name": name}, {"$set": doc}, function (err, res) {
        if (err) return callback(exception(exception.DBError, err.message));
        if (!res) return callback(exception(exception.NotFound, 'NotFound' + id));
        callback(null, res);
      })
  }
}
//删除一篇文章
exports.remove = function (mongo, id, name) {
  return function (callback) {
    mongo
      .db('vimblog')
      .collection('articles')
      .remove({"_id": new ObjectID(id), "name": name}, function (err, res) {
        if (err) return callback(exception(exception.DBError, err.message));
        if (!res) return callback(exception(exception.NotFound, 'NotFound' + id));
        callback(null, res);
      })
  }
}
//转载一篇文章
exports.reprint = function (mongo, id, currentUser) {
  return function (callback) {
    mongo
      .db('vimblog')
      .collection('articles')
      .findAndModify({"_id": new ObjectID(id)}, [], {"$inc": {reprintNum: 1}}, {new: true}, function (err, doc) {
        if (err) return callback(exception(exception.DBError, err.message));
        if (!doc) return callback(exception(exception.NotFound, 'NotFound' + id));

        var reprintFrom = {
          "name": currentUser.name,
          "time.day": currentUser.day,
          "title": doc.title,
        }
        var date = new Date();
        var time = {
            date: date,
            year : date.getFullYear(),
            month : date.getFullYear() + "-" + (date.getMonth() + 1),
            day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
            minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
            date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
        }

        delete doc._id;

        var article = Object.assign({}, doc);
        article = {
          name: currentUser.name,
          avatar: currentUser.avatar,
          time: time,
          title: doc.title.match(/^\[转\]/) ? doc.title : '[转]' + doc.title,
          tags: ["转载"],
          comments: [],
          reprintInfo: {
            reprintFrom: reprintFrom
          },
          pageview: 0
        }

        mongo
          .db('vimblog')
          .collection('articles')
          .insert(article, function (err, res) {
            if (err) return callback(exception(exception.DBError, err.message));
            callback(null, res);
          })

      })
  }
}
