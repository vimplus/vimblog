var mongodb = require('./db');
var markdown = require('markdown').markdown;

function Post(name, avatar, title, tags, content) {
  this.name = name;
  this.avatar = avatar;
  this.title = title;
  this.tags = tags;
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
    avatar: this.avatar,
    time: time,
    title: this.title,
    tags: this.tags,
    content: this.content,
    comments: [],
    reprintInfo: {},
    pageview: 0
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
Post.getList = function (name, page, callback) {
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

      //使用 count 返回特定查询的文档数 total
      collection.count(query, function (err, total) {
        //根据 query 对象查询，并跳过前 (page-1)*10 个结果，返回之后的 10 个结果
        collection.find(query, {skip: (page - 1)*10, limit: 10})
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
          callback(null, docs, total); //成功，以数组形式返回查询的结果
        })
      })
      //根据 query 对象查询文章；


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
        if (err) {
          mongodb.close();
          return callback(err);
        }
        if (doc) {
          collection.update(query, {$inc: {"pageview": 1}}, function (err) {
            mongodb.close();
            if (err) {
              return callback(err);
            }
          })
        }
        doc.content = markdown.toHTML(doc.content);
        doc.comments.forEach(function (comment) {
          comment.content = markdown.toHTML(comment.content);
        })
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
//删除文章
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

//返回所有文章归档信息
Post.getArchive = function (callback) {
  mongodb.open(function (err, db) {
    if (err) return callback(err);
    db.collection('articles', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //只查询包含 name、time、title 属性的文档组成的归档数组
      var filter = {
        "name": 1,
        "time": 1,
        "title": 1
      }
      collection.find({}, filter)
        .sort({ time: -1 }).toArray(function (err, docs) {
          mongodb.close();
          if (err) return callback(err);
          callback(null, docs);
        })
    })
  })
}

//返回所有标签
Post.getTags = function (callback) {
  mongodb.open(function (err, db) {
    if (err) return callback(err);
    db.collection('articles', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //distinct 用来找出给定键的所有不同值
      collection.distinct('tags', function (err, docs) {
        mongodb.close()
        if(err) return callback(null);
        callback(null, docs);
      })
    })
  })
}

//返回含有特定标签的所有文章
Post.getListByTag = function (tag, callback) {
  mongodb.open(function (err, db) {
    if (err) return callback(err);
    db.collection('articles', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //查询所有 tags 数组内包含 tag 的文档, 并返回只含有 name、time、title 组成的数组
      var filter = {
        "name": 1,
        "time": 1,
        "title": 1
      }
      collection.find({"tags": tag}, filter)
        .sort({time: -1}).toArray(function (err, docs) {
          mongodb.close();
          if(err) return callback(null);
          callback(null, docs);
        })
    })
  })
}

//返回通过标题关键字查询的所有文章信息
Post.search = function (keyword, callback) {
  mongodb.open(function (err, db) {
    if (err) return callback(err);
    db.collection('articles', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      var pattern = new RegExp(keyword, "i");
      var filter = {
        "name": 1,
        "time": 1,
        "title": 1
      }
      collection.find({"title": pattern}, filter)
        .sort({time: -1}).toArray(function (err, list) {
          mongodb.close();
          if (err) return callback(null);
          callback(null, list);
        })
    })
  })
}


//转载一篇文章
Post.reprint = function (reprintFrom, reprintTo, callback) {
  mongodb.open(function (err, db) {
    if (err) return callback(err);
    db.collection('articles', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      var queryComer = {
        "name": reprintFrom.name,
        "time.day": reprintFrom.day,
        "title": reprintFrom.title,
      }
      //找到被转载的文章的原文档
      collection.findOne(queryComer, function (err, doc) {
        if (err) {
          mongodb.close();
          return callback(err);
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

        delete doc._id; //一定要删除原来文章的id

        var article = Object.assign({}, doc);
        article = {
          name: reprintTo.name,
          avatar: reprintTo.avatar,
          time: doc.time,
          title: (doc.title.search(/[转载]/) > -1) ? doc.title : '[转载]' + doc.title,
          tags: ["转载"],
          content: doc.content,
          comments: [],
          reprintInfo: {
            reprintFrom: reprintFrom
          },
          pageview: 0
        }

        var newInfo = {
          "name": doc.name,
          "day": time.day,
          "title": doc.title
        }

        //更新被转载的原文档的 reprintInfo 内的 reprintTo
        collection.update(queryComer, {$push: {"reprintInfo.reprintTo": newInfo}}, function (err) {
          if (err) {
            mongodb.close();
            return callback(err);
          }
        });

        //将转载生成的副本修改后存入数据库，并返回储存后的文档
        collection.insert(article, {safe: true}, function (err, res) {
          mongodb.close();
          if (err) return callback(err);
          console.log(res)
          callback(null, res.ops[0]);
        });
      })

    })
  });

}
