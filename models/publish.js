var mongodb = require('./db');
var markdown = require('markdown').markdown;

function Publish(name, title, content) {
  this.name = name;
  this.title = title;
  this.content = content;
}

module.exports = Publish;

Publish.prototype.save = function (callback) {
  var date = new Date();
  //存储各种时间格式，方便以后扩展
  var time = {
      date: date,
      year : date.getFullYear(),
      month : date.getFullYear() + "-" + (date.getMonth() + 1),
      day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
      minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
      date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
  }

  var article = {
    name: this.name,
    time: time,
    title: this.title,
    content: this.content
  }

  //打开数据库
  mongodb.open(function (err, db) {
    if(err) return callback(err);
    //读取 articles 集合
    db.collection('articles', function (err, collection) {
      if (err) {
        mongodb.close();
        callback(err);
      }
      //将文档插入集合
      collection.insert(article, {safe: true}, function (err) {
        mongodb.close();
        if (err) {
          callback(err); //失败！返回 err
        }
        callback(null); //成功，返回 err 为 null
      })

    })
  });
}

//读取文章
Publish.get = function (name, callback) {
  mongodb.open(function (err, db) {
    if(err) return callback(err);
    console.log('错误：' + err)
    //读取 articles 集合
    db.collection('articles', function (err, collection) {
      if(err) {
        mongodb.close();
        callback(err);
      }
      var query = {};
      if (name) { query.name = name}

      //根据 query 对象查询文章；
      collection.find(query)
        .sort({time: -1})
        .toArray(function (err, docs) {
        mongodb.close();
        if(err) callback(err);

        docs.forEach(function (doc) {
          doc.content = markdown.toHTML(doc.content)
        })
        callback(null, docs); //成功，以数组形式返回查询的结果
      })

    })

  })
}
