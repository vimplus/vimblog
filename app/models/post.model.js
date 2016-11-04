var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PostSchema = new Schema({
  title: {type: String},
  tags: {type: Array},
  time: {type: Object},
  name: {type: String},
  avatar: {type: String},
  content: {type: String},
  comments: {type: Array},
  reprintInfo: {type: Object},
  pageview: {type: Number, default: 0}
})

var PostModel = mongoose.model('articles', PostSchema);
module.exports = PostModel;
