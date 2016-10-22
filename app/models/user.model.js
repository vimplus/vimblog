var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//import mongoose, {Schema} from 'mongoose';

var UserSchema = new Schema({
    username: {
        type: String,
        unique: true,
        trim: true,
        required: true,
        index: true
    },
    name: String,
    nickname: String,
    email: {
        type: String,
        validate: {
            validator: function(email) {
                return /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email);
            },
            message: '{VALUE} is not a valid email!'
        }
    },
    password: {
        type: String,
        required: true
    },
    state: {
        type: String,
        enum: ["single", "inlove"]
    },
    gender: {
        type: Number,
        enum: [1, 2, 3],
        default: 3
    },
    phone_no: String,
    accessToken: String,
    avatar: String,
    location: String,
    url: String,
    signature: String,
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: Date
})
UserSchema.set('autoIndex', false);
// on every save, add the date
UserSchema.pre('save', function(next) {
  var currentDate = new Date().getTime();
  this.updated_at = currentDate;
  next();
});
var User = mongoose.model('User', UserSchema)
module.exports = User;
