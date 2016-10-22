//var UserController = require('../app/controllers/user.controller');

var crypto = require('crypto');
var User = require('../models/user.js');
var Publish = require('../models/publish.js');


/* routes */
module.exports = function (app) {
  app.get('/', function (req, res) {
    Publish.get(null, function (err, list) {
      if (err) list = [];
      console.log(list)
      res.render('index', {
        title: '主页',
        user: req.session.user,
        articlesList: list,
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
        res.flash('error', '密码错误！');
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
    var newUser = new User({
        name: name,
        password: password,
        email: req.body.email
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

  app.post('/publish', checkLogin)
  app.post('/publish', function (req, res) {
    var currentUser = req.session.user;
    var article = new Publish(currentUser.name, req.body.title, req.body.content);
    article.save(function (err) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/')
      }
      req.flash('success', '发表成功！')
      return res.redirect('/')
    })
  })

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

}
