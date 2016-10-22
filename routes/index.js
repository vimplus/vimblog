//var UserController = require('../app/controllers/user.controller');

var crypto = require('crypto');
var User = require('../models/user.js');

/* routes */
module.exports = function (app) {
  app.get('/', function (req, res, next) {
    res.render('index', { title: 'Express' });
  })
  app.get('/login', function (req, res, next) {
    res.render('login', { title: 'Express' });
  })
  app.get('/register', function (req, res, next) {
    res.render('register', { title: 'Express' });
  })
  app.post('/register', function (req, res) {
    var name = req.body.name;
    var password = req.body.password;
    //生成密码的 md5 值
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
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
  app.get('/logout', function (req, res, next) {
    res.render('register', { title: 'Express' });
  })
  app.get('/users', function (req, res, next) {
    res.send('respond with a resource');
  })
}

/*function (req, res) {
  console.log(req.body)
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
}*/
