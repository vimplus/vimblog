//var UserController = require('../app/controllers/user.controller');

var crypto = require('crypto');
var multer  = require('multer');
var User = require('../models/user.js');
var Post = require('../models/Post.js');
var Comment = require('../models/comment.js');

var storage = multer.diskStorage({
  //上传后的文件所在目录
  destination: function (req, file, callback) {
    callback(null, './public/images')
  },
  //用来修改上传文件的文件名
  filename: function functionName(req, file, callback) {
    callback(null, file.originalname)
  }
})

var upload = multer({ storage: storage });


function checkLogin(req, res, next) {
  if(!req.session.user){
    req.flash('error', '未登录');
    res.redirect('/login');
  }
  next();
}

function checkNotLogin(req, res, next) {
  if(req.session.user){
    res.flash('error', '已登录');
    res.redirect('back');  //返回之前的页面
  }
  next();
}

/* routes */
module.exports = function (app) {
  app.get('/', function (req, res) {
    //判断是否是第一页，并把请求的页数转换成 number 类型
    var page = parseInt(req.query.page, 10) || 1;
    //查询并返回第 page 页的 10 篇文章
    Post.getList(null, page, function (err, list, total) {
      if (err) list = [];
      res.render('index', {
        title: '主页',
        user: req.session.user,
        articleList: list,
        page: page,
        pageNumer: Math.ceil(total / 10),
        isFirstPage: (page - 1) == 0,
        isLastPage: ((page - 1) * 10 + list.length) == total,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    })
  })
  app.get('/login', function (req, res) {
    res.render('login', {
      title: '登录',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  })
  app.post('/login', function (req, res) {
    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body.password).digest('hex');
    User.get(req.body.name, function (err, user) {
      if (!user) {
        req.flash('error', '用户名不存在！')
        return res.redirect('/login'); //用户不存在则跳转到登录页
      }
      //检查密码是否一致
      if (user.password != password) {
        req.flash('error', '密码错误！');
        return res.redirect('/login');
      }
      //用户名密码都匹配后，将用户信息存入 session
      req.session.user = user;
      req.flash('success', '登录成功！');
      res.redirect('/'); //登录成功，跳转主页。

    })
  })
  app.get('/register', function (req, res, next) {
    res.render('register', {
      title: '注册',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  })
  app.post('/register', function (req, res) {
    var name = req.body.name;
    var password = req.body.password;
    //生成密码的 md5 值
    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body.password).digest('hex');
    var Md5 = crypto.createHash('md5');
    var emailMD5 = Md5.update(req.body.email.toLowerCase()).digest('hex');
    var avatar = 'http://www.gravatar.com/avatar/' + emailMD5 + '?s=48';

    var newUser = new User({
        name: name,
        password: password,
        email: req.body.email,
        avatar: avatar
    });
    //检查用户名是否已经存在
    User.get(newUser.name, function (err, user) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      if (user) {
        req.flash('error', '用户已存在!');
        return res.redirect('/register');//返回注册页
      }
      //如果不存在则新增用户
      newUser.save(function (err, user) {
        if (err) {
          req.flash('error', err);
          return res.redirect('/register');//注册失败返回主册页
        }
        req.session.user = newUser;//用户信息存入 session
        req.flash('success', '注册成功!');
        res.redirect('/');//注册成功后返回主页
      });
    });
  })

  app.get('/logout', function (req, res) {
    req.session.user = null;
    req.flash('success', '退出成功！');
    res.redirect('/'); //退出后返回首页
  })

  app.get('/publish', checkLogin);
  app.get('/publish', function (req, res) {
    res.render('publish', {
        title: '发表',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()});
  });

  app.post('/publish', checkLogin);
  app.post('/publish', function (req, res) {
    var currentUser = req.session.user;
    console.log(currentUser)
    var tags = [req.body.tag1, req.body.tag2, req.body.tag3];
    var article = new Post(currentUser.name, currentUser.avatar, req.body.title, tags, req.body.content);
    article.save(function (err) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/')
      }
      req.flash('success', '发表成功！')
      return res.redirect('/')
    })
  })

  //定义上传页面
  app.get('/upload', checkLogin);
  app.get('/upload', function (req, res) {

    res.render('upload', {
      title: '文件上传',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });

  });
  //上传文件post
  app.post('/upload', checkLogin);
  app.post('/upload', upload.array('field', 5), function (req, res) {
    req.flash('success', '文件上传成功！');
    res.redirect('/upload')
  });

  //获取用户的所有文章
  app.get('/u/:name', function (req, res) {
    var page = parseInt(req.query.page, 10) || 1;
    //检测用户名存不存在
    User.get(req.params.name, function (err, user) {
      if (!user) {
        req.flash('error', '用户不存在！');
        return res.redirect('/')
      }

      Post.getList(req.params.name, page, function (err, list, total) {
        if (err) {
          req.flash('error', err);
          return res.redirect('/');
        }
        res.render('user', {
          title: user.name,
          articleList: list,
          page: page,
          pageNumer: Math.ceil(total / 10),
          isFirstPage: (page - 1) == 0,
          isLastPage: ((page - 1) * 10 + list.length) == total,
          user: req.session.user,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
        })
      });
    })
  });

  //获取一篇文章
  app.get('/edit/:name/:day/:title', checkLogin);
  app.get('/u/:name/:day/:title', function (req, res) {
    Post.getOne(req.params.name, req.params.day, req.params.title, function (err, doc) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      res.render('article', {
        title: req.params.title,
        article: doc,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    })
  })
  //提交留言
  app.post('/u/:name/:day/:title', function (req, res) {
    var date = new Date();
    var time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
             date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
    var md5 = crypto.createHash('md5');
    var emailMD5 = md5.update(req.body.email.toLowerCase()).digest('hex');
    var avatar = 'http://www.gravatar.com/avatar/' + emailMD5 + '?s=48';
    var comment = {
      name: req.body.name,
      avatar: avatar,
      email: req.body.email,
      website: req.body.website,
      time: time,
      content: req.body.content
    }
    var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
    newComment.save(function (err) {
      if (err) {
        req.flash('error', err);
        return res.redirect('back');
      }
      req.flash('success', '留言成功!');
      res.redirect('back');
    })
  })

  //定义文章编辑页面路由
  app.post('/edit/:name/:day/:title', checkLogin);
  app.get('/edit/:name/:day/:title', function (req, res) {
    Post.edit(req.params.name, req.params.day, req.params.title, function (err, doc) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      res.render('edit', {
        title: '编辑 - '+req.params.title,
        article: doc,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    })
  })
  //编辑文章
  app.post('/edit/:name/:day/:title', function (req, res) {
    Post.update(req.params.name, req.params.day, req.params.title, req.body.content, function (err) {
      var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
      if (err) {
        req.flash('error', err);
        return res.redirect(url);//出错！返回文章页
      }
      req.flash('success', '修改成功!');
      res.redirect(url);//成功！返回文章页
    })
  })

  //删除文章
  app.get('/remove/:name/:day/:title', checkLogin);
  app.get('/remove/:name/:day/:title', function (req, res) {
    Post.remove(req.params.name, req.params.day, req.params.title, function (err) {
      if (err) {
        req.flash('error', err);
        return res.redirect('back');
      }
      req.flash('success', '删除成功！');
      res.redirect('/')
    })
  })
  //转载文章
  app.get('/reprint/:name/:day/:title', checkLogin);
  app.get('/reprint/:name/:day/:title', function (req, res, callback) {
    //我们需要通过Post.edit返回一篇文章的markdown格式的文本
    Post.edit(req.params.name, req.params.day, req.params.title, function (err, article) {
      if (err) {
        req.flash('error', err);
        return res.redirect(back);
      }
      var currentUser = req.session.user;
      var reprintFrom = {
        name: article.name,
        day: article.time.day,
        title: article.title,
      }
      var reprintTo = {
        name: currentUser.name,
        avatar: currentUser.avatar
      }
      Post.reprint(reprintFrom, reprintTo, function (err, doc) {
        if (err) {
          req.flash('error', err);
          return res.redirect('back');
        }
        req.flash('success', '转载成功!');
        var url = encodeURI('/u/' + doc.name + '/' + doc.time.day + '/' + doc.title);
        //转载后跳转到当前的文档
        res.redirect(url);
      })

    })
  });

  //归档
  app.get('/archive', function (req, res) {
    Post.getArchive(function (err, list) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      res.render('archive', {
        title: '归档',
        articleList: list,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      })
    })
  });
  //标签页
  app.get('/tags', function (req, res) {
    Post.getTags(function (err, docs) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      res.render('tags', {
        title: '标签',
        tags: docs,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      })
    })
  })
  //通过标签获取
  app.get('/tags/:tag', function (req, res) {
    Post.getListByTag(req.params.tag, function (err, list) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      res.render('tag', {
        title: 'Tag:' + req.params.tag,
        articleList: list,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      })
    });
  });


  app.get('/search', function (req, res) {
    Post.search(req.query.keyword, function (err, list) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      res.render('search', {
        title: '搜索:' + req.query.keyword,
        articleList: list,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      })
    })
  })


}