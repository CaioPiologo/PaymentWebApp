var mongoose = require('mongoose')

var UserSchema = new mongoose.Schema({
  cpf: {
    type: String,
    required: true
  },
  status: {
    type: Number,
    required: true
  }
})

var BankTicket = mongoose.model('BankTicket', UserSchema)
module.exports = BankTicket
