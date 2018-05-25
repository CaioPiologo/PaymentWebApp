var mongoose = require('mongoose')

var CreditCardSchema = new mongoose.Schema({
  number: {
    type: String,
    unique: true,
    required: true
  },
  hasCredit: {
    type: Boolean,
    required: true
  }
})

var CreditCard = mongoose.model('CreditCard', CreditCardSchema)
module.exports = CreditCard
