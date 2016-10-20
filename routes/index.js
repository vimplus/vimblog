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
  app.get('/users', function (req, res, next) {
    res.send('respond with a resource');
  })
}
