var mongoose = require('mongoose')
var bcrypt = require('bcrypt')

var UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  clientID: {
    type: String,
    required: false
  }
})

UserSchema.statics.authenticate = function (email, password, callback) {
  User.findOne({ email: email })
    .exec(function (err, user) {
      if (err) { return callback(err) }

      if (!user) {
        var error = new Error('User not found!')
        error.status = 401
        return callback(error)
      }

      bcrypt.compare(password, user.password, function (err, result) {
        if (result === true) {
          return callback(null, true)
        } else {
          return callback(err)
        }
      })
    })
}

UserSchema.pre('save', function (next) {
  var user = this
  bcrypt.hash(user.password, 10, function (err, hash) {
    if (err) { return next(err) }

    user.password = hash
    next()
  })
})

var User = mongoose.model('User', UserSchema)
module.exports = User
