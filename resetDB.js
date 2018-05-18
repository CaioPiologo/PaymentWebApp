#!/usr/bin/env /usr/local/bin/node

var mongoose = require('mongoose')
mongoose.connect('mongodb://mc851_payment:mc8512018@ds143362.mlab.com:43362/mc851_payment_service')
var db = mongoose.connection

db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function () {
  // we're connected!
})

db.dropDatabase(function (err, result) {
  console.log(err, result)
})
