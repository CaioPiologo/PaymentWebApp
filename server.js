const express = require('express');
const path = require('path');

const app = express();
const bodyParser = require('body-parser');
const port = process.env.PORT || 5000;

const MongoClient = require('mongodb').MongoClient

var db;
MongoClient.connect('mongodb://mc851_payment:mc8512018@ds143362.mlab.com:43362/mc851_payment_service',
 (err, client) => {
   if (err) return console.log(err);
   db = client.db('mc851_payment_service');
   app.listen(port, () => console.log(`Listening on port ${port}`));
})

/* Uncomment this line to use the server with the react application */
// app.use(express.static(path.join(__dirname, 'client/build')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get('/api/hello', (req, res) => {
   res.send({ express: 'Hello World' });
});

app.post('/quotes', (req, res) => {

   db.collection('quotes').save(req.body, (err, result) => {
      if (err) return console.log(err)

      console.log('saved to database')
      res.redirect('/')
   })
})

/// Check the informations, (in the future contact the credit module) and return the payment status
app.post('/payments/creditCard', (req, res) => {
  // receive stuff from require (req)
  var clientInfo = req.body
  console.log(clientInfo)

  var result = 'AUTHORIZED'
  var reason = null
  var responseCode = 200

  if (!clientInfo.hasOwnProperty('clientCardName') ||
      !clientInfo.hasOwnProperty('cpf') ||
      !clientInfo.hasOwnProperty('cardNumber') ||
      !clientInfo.hasOwnProperty('month') ||
      !clientInfo.hasOwnProperty('year') ||
      !clientInfo.hasOwnProperty('securityCode') ||
      !clientInfo.hasOwnProperty('value') ||
      !clientInfo.hasOwnProperty('instalments')) {
    result = 'UNAUTHORIZED'
    reason = 'Missing information.'
  } else if (clientInfo.cpf.toString().length !== 11) {
    result = 'UNAUTHORIZED'
    reason = 'Wrong CPF.'
  } else if (clientInfo.cardNumber.toString().length !== 16) {
    result = 'UNAUTHORIZED'
    reason = 'Wrong card number.'
  }

  // then return any response if needed
  res.status(responseCode).send({
    operationHash: Math.random().toString(36).substring(2),
    result: result,
    reason: reason
  });
});

/// Return the possible instalments values given the card flag.
app.post('/payments/creditCard/installments', (req, res) => {
  var value = parseInt(req.body.value)
  var flag = req.body.cardFlag
  var nOfInstalments = 1
  var responseCode = 200

  switch (flag) {
    case 'MASTER_CARD':
      nOfInstalments = 12
      break
    case 'VISA':
      nOfInstalments = 10
      break
    default:
      nOfInstalments = 6
      break
  }

  var installments = {}

  for (let i = 1; i <= nOfInstalments; i++) {
    installments[i.toString()] = value / i
  }

  // then return any response if needed
  res.status(responseCode).send({installments: installments})
})

app.post('/payments/bankTicket', (req, res) => {
  var clientInfo = req.body
  console.log(clientInfo)

  var documentPath = null
  var reason = null
  var responseCode = 200

  if (!clientInfo.hasOwnProperty('clientName') ||
      !clientInfo.hasOwnProperty('cpf') ||
      !clientInfo.hasOwnProperty('address') ||
      !clientInfo.hasOwnProperty('cep') ||
      !clientInfo.hasOwnProperty('value')) {
    reason = 'Missing information.'
  } else if (clientInfo.cpf.toString().length !== 11) {
    reason = 'Wrong CPF.'
  } else if (clientInfo.cep.toString().length !== 8) {
    reason = 'Wrong CEP.'
  } else {
    documentPath = '/payments/bankTicket/' + Math.random().toString(36).substring(2)
  }

  res.status(responseCode).send({
    documentPath: documentPath,
    reason: reason
  })
})

app.get('/payments/bankTicket/:code', (req, res) => {
  console.log(req.params.code)
  // TODO: send document
  res.status(200).send()
})

app.get('/payments/bankTicket/:code/status', (req, res) => {
  console.log(req.params.code)

  var status = ''
  var responseCode = 200
  var ticketStatusFromAPI = Math.floor(Math.random() * 4) + 1

  console.log(ticketStatusFromAPI)

  switch (ticketStatusFromAPI) {
    case 1:
      status = 'PENDING_PAYMENT'
      break
    case 2:
      status = 'EXPIRED'
      break
    case 3:
      status = 'OK'
      break
    default:
      status = 'NOT_FOUND'
      responseCode = 404
      break
  }

  res.status(responseCode).send({
    status: status
  })
})
