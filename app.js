var path = require('path');
var koa = require('koa');
var logger = require('koa-logger');
var mongo = require('koa-mongo');
var session = require('koa-generic-session');
var flash = require('koa-flash');
var render = require('koa-ejs');
var serve = require('koa-static');
var bodyParser = require('koa-bodyparser');

var routes = require('./routes/index');
var config = require('./config/config.json');
var exception = require('./libs/exception');

var fs = require('fs');
var accessLog = fs.createWriteStream('access.log', {flags: 'a'});
var errorLog = fs.createWriteStream('error.log', {flags: 'a'});

var app = koa();
app.keys = config.keys;

render(app, {
  root: path.join(__dirname, 'views'),
  layout: false,
  viewExt: 'ejs'
})

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger());
//app.use(logger({stream: accessLog}));
app.use(bodyParser());
app.use(session());
app.use(flash());
app.use(mongo(config.mongo));
app.use(serve(__dirname + '/public'));

app.use(function* (next) {
  try {
    yield next;
  } catch (err) {
    switch (err.code) {
      case exception.RequestError:
        this.flash = err.message;
        this.redirect('back');
        break;
      case exception.NotFound:
        this.redirect('/404');
        break;
      case exception.DBError:
      case exception.ServerError:
        this.flash = err.message;
        this.redirect('/');
        break;
      default:
        this.flash = err.message;
        this.redirect('/');
    }
  }
})

routes(app);

var port = process.env.port || config.app;
app.listen(port, function () {
  console.log('App listening on port:' + port);
})
