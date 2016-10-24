var mongodb = require('./db');
var markdown = require('markdown').markdown;

function Post(name, title, content) {
  this.name = name;
  this.title = title;
  this.content = content;
}

module.exports = Post;

Post.prototype.save = function (callback) {
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
    content: this.content,
    comments: []
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

//获取文章列表
Post.getAll = function (name, callback) {
  mongodb.open(function (err, db) {
    if(err) return callback(err);
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
          if (doc) {
            doc.content = markdown.toHTML(doc.content)
            doc.comments.forEach(function (comment) {
              comment.content = markdown.toHTML(comment.content)
            })
          }
        })
        callback(null, docs); //成功，以数组形式返回查询的结果
      })

    })

  })
}

//获取一篇文章
Post.getOne = function (name, day, title, callback) {
  mongodb.open(function (err, db) {
    if (err) return callback(err);

    db.collection('articles', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //根据用户名、文章日期、文章标题查询文章
      var query = {
        "name": name,
        "time.day": day,
        "title": title
      }
      collection.findOne(query, function (err, doc) {
        mongodb.close();
        if (err) return callback(err);

        doc.content = markdown.toHTML(doc.content);
        callback(null, doc); //返回查询的文章

      })
    })

  })
}

//获取原始发表的内容（markdown 格式）
Post.edit = function (name, day, title, callback) {
  mongodb.open(function (err, db) {
    if (err) return callback(err);
    db.collection('articles', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //定义查询条件
      var query = {
        "name": name,
        "time.day": day,
        "title": title
      }
      collection.findOne(query, function (err, doc) {
        mongodb.close();
        if (err) return callback(err);

        callback(null, doc);
      })
    })
  })
}
//更新文章
Post.update = function (name, day, title, content, callback) {
  mongodb.open(function (err, db) {
    if (err) return callback(err);
    db.collection('articles', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //定义查询条件
      var query = {
        "name": name,
        "time.day": day,
        "title": title
      }
      //更新内容
      collection.update(query, {$set: {content: content}}, function (err) {
        mongodb.close();
        if (err) return callback(err);

        callback(null);
      })
    })
  })
}

Post.remove = function (name, day, title, callback) {
  mongodb.open(function (err, db) {
    if (err) return callback(err);
    db.collection('articles', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //定义查询条件
      var query = {
        "name": name,
        "time.day": day,
        "title": title
      }
      //删除一篇文章
      collection.remove(query, { w: 1}, function (err) {
        mongodb.close();
        if (err) return callback(err);
        callback(null);
      })
    })

  })
}
