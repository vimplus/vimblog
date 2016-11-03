var koa = require('koa');
var logger = require('koa-logger');
var mongo = require('koa-mongo');
var session = require('koa-session');
var flash = require('koa-flash');
var render = require('koa-ejs');
var serve = require('koa-static');
var bodyParser = require('koa-bodyparser');

/*var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var flash = require('connect-flash');*/

var routes = require('./routes/index');
var config = require('./config/config.json');
var exception = require('./libs/exception');

var fs = require('fs');
var accessLog = fs.createWriteStream('access.log', {flags: 'a'});
var errorLog = fs.createWriteStream('error.log', {flags: 'a'});

//var db = mongodb();
var app = koa();
app.keys = config.keys;

var CONFIG = {
  key: 'koa:sess', /** (string) cookie key (default is koa:sess) */
  maxAge: 86400000, /** (number) maxAge in ms (default is 1 days) */
  overwrite: true, /** (boolean) can overwrite or not (default true) */
  httpOnly: true, /** (boolean) httpOnly or not (default true) */
  signed: true, /** (boolean) signed or not (default true) */
};

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger());
//app.use(logger({stream: accessLog}));
app.use(bodyParser());
app.use(session(app));
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
