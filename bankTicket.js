var mongoose = require('mongoose')

var BankTicketSchema = new mongoose.Schema({
  cpf: {
    type: String,
    required: true
  },
  status: {
    type: Number,
    required: true
  }
})

var BankTicket = mongoose.model('BankTicket', BankTicketSchema)
module.exports = BankTicket
