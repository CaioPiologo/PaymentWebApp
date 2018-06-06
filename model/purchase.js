var mongoose = require('mongoose')

var PurchaseSchema = new mongoose.Schema({
  trackingNumber: {
    type: String,
    unique: true,
    required: true
  },
  clientID: {
    type: String,
    required: [true, 'Client ID required']
  },
  products: {
    type: Array,
    default: [],
    validate: {
      validator: function (value) {
        return value.productID && value.amount
      },
      message: 'Product {VALUE} is missing some parameters'
    }
  },
  bankTicketID: {
    type: String,
    required: false
  }
})

var Purchase = mongoose.model('Purchase', PurchaseSchema)
module.exports = Purchase
