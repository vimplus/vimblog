var Post = require('../models/post.model.js');

module.exports = {
  save: function () {

  },
  getList: function* (name) {
    var query = {}
    if (name) query.name = name;

    var page = this.query.page ? parseInt(this.query.page, 10) : 1;
    var pageSize = query.pageSize ? parseInt(query.pageSize, 10) : 10;

    var list = yield Post.find().sort({time: -1}).skip((page - 1) * pageSize).limit(pageSize);
    var count = yield Post.count();
    this.body = {
      code: 10000,
      data: {
        list: list,
        page: page,
        size: pageSize,
        total: count
      },
      message: 'success'
    };
  }
}
