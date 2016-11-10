var route = require('koa-route');
/*var koaRouter = require('koa-router');
var Router = new koaRouter();*/
var PostController = require('../controllers/post.controller');

module.exports = function (app) {
  app.use(route.get('/api/post/1.0/getList', PostController.getList))
}
