var gravatar = require('gravatar');
var moment = require('moment');
var route = require('koa-route');


/*var crypto = require('crypto');*/
var multer  = require('multer');
var User = require('../models/user.js');
var Post = require('../models/post.js');
var Comment = require('../models/comment.js');
var exception = require('../libs/exception');
var md5 = require('../libs/md5');

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


function* checkLogin() {
  if(!this.session.user){
    this.flash = '未登录！';
    return this.redirect('/login');
  }
  yield arguments[arguments.length - 1];
}

function* checkNotLogin() {
  if(this.session.user){
    this.flash = '已登录！';
    return this.redirect('back');  //返回之前的页面
  }
  yield arguments[arguments.length - 1];
}

/* routes */
module.exports = function (app) {
  //访问首页
  app.use(route.get('/', function* () {
    //判断是否是第一页，并把请求的页数转换成 number 类型
    var page = this.query.page ? parseInt(this.query.page, 10) : 1;
    var list = yield Post.getList(this.mongo, null, page);
    var total = yield Post.count(this.mongo);

    yield this.render('index', {
      title: '主页',
      user: this.session.user,
      articleList: list,
      page: page,
      pageNumer: Math.ceil(total / 10),
      isFirstPage: (page - 1) == 0,
      isLastPage: ((page - 1) * 10 + list.length) == total,
      flash: this.flash
    })
  }));
  //访问注册页面
  app.use(route.get('/register', checkNotLogin));
  app.use(route.get('/register', function* () {
    yield this.render('register', {
      title: '注册',
      user: this.session.user,
      flash: this.flash
    })
  }));
  //请求注册
  app.use(route.post('/register', checkNotLogin));
  app.use(route.post('/register', function* () {
    var body = this.request.body;
    var name = body.name;
    var password = body.password;
    var email = body.email;

    var user = yield User.get(this.mongo, name);
    if (user) throw exception(exception.RequestError, '用户名已存在');

    var newUser = {
      name: name,
      password: md5(password),
      email: email,
      avatar: gravatar.url(email, {s: 48})
    }

    yield User.save(this.mongo, newUser);

    delete newUser.password;
    this.session.user = newUser;
    this.flash = '注册成功！';
    this.redirect('/');

  }));
  //访问登录页面
  app.use(route.get('/login', checkNotLogin));
  app.use(route.get('/login', function* () {
    yield this.render('login', {
      title: '登录',
      user: this.session.user,
      flash: this.flash
    })
  }));
  //登录
  app.use(route.post('/login', checkNotLogin));
  app.use(route.post('/login', function* () {
    var body = this.request.body;
    var name = body.name;
    var password = body.password;

    var user = yield User.get(this.mongo, name);
    if (!user) throw exception(exception.RequestError, '用户不存在！');
    if (md5(password) != user.password) throw exception(exception.RequestError, '密码错误！');

    delete user.password;
    this.session.user = user;
    this.flash = '登录成功！';
    this.redirect('/');
  }));
  //退出
  app.use(route.get('/logout', checkLogin));
  app.use(route.get('/logout', function* () {
    this.session.user = null;
    this.flash = '成功退出！';
    this.redirect('/');
  }));

  //访问发表文章
  app.use(route.get('/publish', checkLogin));
  app.use(route.get('/publish', function* () {
    yield this.render('publish', {
      title: '发表',
      user: this.session.user,
      flash: this.flash,
    })
  }));
  //发表文章
  app.use(route.post('/publish', checkLogin));
  app.use(route.post('/publish', function* () {
    var currentUser = this.session.user;
    var body = this.request.body;
    yield Post.save(this.mongo, this.session.user, this.request.body);

    this.flash = '发表成功！';
    this.redirect('/');
  }));

  //归档
  app.use(route.get('/archive', function* () {
    var list = yield Post.getArchive(this.mongo);
    yield this.render('archive', {
      title: '归档',
      articleList: list,
      user: this.session.user,
      flash: this.flash
    })
  }));

  //标签页
  app.use(route.get('/tags', function* () {
    var allTags = yield Post.getTags(this.mongo)
    yield this.render('tags', {
      title: '标签',
      tags: allTags,
      user: this.session.user,
      flash: this.flash
    })
  }))

  //通过标签获取文章列表
  app.use(route.get('/tags/:tag', function* (tag) {
    var list = yield Post.getListByTag(this.mongo, tag);

    yield this.render('tag', {
      title: 'Tag:' + tag,
      articleList: list,
      user: this.session.user,
      flash: this.flash
    })
  }));

  //搜索
  app.use(route.get('/search', function* () {
    var keyword = this.query.keyword;
    var list = yield Post.search(this.mongo, keyword);

    yield this.render('search', {
      title: 'Search:' + keyword,
      articleList: list,
      user: this.session.user,
      flash: this.flash
    })
  }));

  //根据用户名获取该用户所有文章
  app.use(route.get('/u/:name', function* (name) {
    var page = this.query.page ? parseInt(this.query.page, 10) : 1;
    var list = yield Post.getList(this.mongo, name, page);
    var total = yield Post.count(this.mongo, name);

    yield this.render('user', {
      title: name,
      articleList: list,
      page: page,
      user: this.session.user,
      isFirstPage: (page - 1) == 0,
      isLastPage: ((page - 1) * 10 + list.length) == total,
      flash: this.flash
    })
  }));
  //根据id获取一篇文章
  app.use(route.get('/p/:id', function* (id) {
    var article = yield Post.findById(this.mongo, id);
    yield this.render('article', {
      title: article.title,
      article: article,
      user: this.session.user,
      flash: this.flash
    })
  }));
  //根据用户名、日期、标题获取一篇文章
  app.use(route.get('/u/:name/:day/:title', function* (name, day, title) {
    var article = yield Post.findByTitle(this.mongo, name, day, title);
    yield this.render('article', {
      title: article.title,
      article: article,
      user: this.session.user,
      flash: this.flash
    })
  }));
  //发布留言
  app.use(route.post('/p/:id', checkLogin));
  app.use(route.post('/p/:id', function* (id) {
    var body = this.request.body;

    var newComment = {
      name: body.name,
      avatar: gravatar.url(body.email, {s: 48}),
      email: body.email,
      website: body.website,
      time: Date.now(),
      content: body.content
    }

    yield Post.commentById(this.mongo, id, newComment);
    this.flash = '留言成功！';
    this.redirect('back');
  }));

  //编辑文章
  app.use(route.get('/edit/:id/', checkLogin));
  app.use(route.get('/edit/:id/', function* (id, next) {
    var currentUser = this.session.user;
    var article = yield Post.getRawOne(this.mongo, id, currentUser.name);

    yield this.render('edit', {
      title: '编辑' + article.title,
      article: article,
      user: this.session.user,
      flash: this.flash
    });
  }));

  app.use(route.post('/edit/:id', checkLogin));
  app.use(route.post('/edit/:id', function* (id) {
    var currentUser = this.session.user;
    yield Post.update(this.mongo, id, currentUser.name, this.request.body);

    this.flash = '修改成功！';
    this.redirect('/p/' + id);
  }));

  //删除文章
  app.use(route.get('/delete/:id', checkLogin));
  app.use(route.get('/delete/:id', function* (id) {
    var currentUser = this.session.user;
    yield Post.remove(this.mongo, id, currentUser.name);

    this.flash = '删除成功！';
    this.redirect('/');
  }))

  //转载文章
  app.use(route.get('/reprint/:id', checkLogin));
  app.use(route.get('/reprint/:id', function* (id) {
    var currentUser = this.session.user;
    yield Post.getReprint(this.mongo, id, currentUser.name);

    this.flash = '删除成功！';
    this.redirect('/');
  }));

  //404
  app.use(function* () {
    yield this.render('404');
  })

  //定义上传页面
  /*app.get('/upload', checkLogin);
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
  });*/

}
