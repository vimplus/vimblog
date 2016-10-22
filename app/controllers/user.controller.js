var crypto = require('crypto');
var User = require('../models/user.model');
//var mongodb = require('../../config/db');

module.exports = {
  register: function (req, res, next) {
    var newUser = Object.assign({}, req.body);
    var password = req.body.password;
    //生成密码的 md5 值
    var md5 = crypto.createHash('md5');
    newUser.password = md5.update(password).digest('hex');

    User.findOne({username: newUser.username}, function (err, user) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      if (user) {
        req.flash('error', '用户已存在!');
        return res.json({error:10010, msg:'用户已存在'})
        //return res.redirect('/register'); //返回注册页
      }
    });

    var user = new User(newUser)
    user.save(function (err) {
      if(err) return next()
      return res.json(user)
    })
  }
}
