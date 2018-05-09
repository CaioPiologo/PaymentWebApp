const express = require('express')
const path = require('path')

const app = express()
const bodyParser = require('body-parser')
const port = process.env.PORT || 5000

const MongoClient = require('mongodb').MongoClient
const User = require('./user')
var mongoose = require('mongoose')
var session = require('express-session')
var MongoStore = require('connect-mongo')(session)

mongoose.connect('mongodb://mc851_payment:mc8512018@ds143362.mlab.com:43362/mc851_payment_service')
var db = mongoose.connection
// MongoClient.connect('mongodb://mc851_payment:mc8512018@ds143362.mlab.com:43362/mc851_payment_service',
//  (err, client) => {
//    if (err) return console.log(err)
//    db = client.db('mc851_payment_service')
//    app.listen(port, () => console.log(`Listening on port ${port}`))
//  })

db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function () {
  // we're connected!
})

/* Uncomment this line to use the server with the react application */
// app.use(express.static(path.join(__dirname, 'client/build')));
app.use(session({
  secret: 'work hard',
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: db
  })
}))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

app.get('/api/hello', (req, res) => {
  res.send({ express: 'Hello World' })
})

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
  var errorMessage = null
  var opHash = null
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
    responseCode = 400
    errorMessage = 'Missing information.'
  } else if (clientInfo.cpf.toString().length !== 11) {
    result = 'UNAUTHORIZED'
    responseCode = 400
    errorMessage = 'Wrong CPF.'
  } else if (clientInfo.cardNumber.toString().length !== 16) {
    result = 'UNAUTHORIZED'
    responseCode = 400
    errorMessage = 'Wrong card number.'
  } else {
    opHash = Math.random().toString(36).substring(2)
  }

  // then return any response if needed
  res.status(responseCode).send({
    operationHash: opHash,
    result: result,
    errorMessage: errorMessage
  })
})

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

  var code = null
  var errorMessage = null
  var responseCode = 200

  if (!clientInfo.hasOwnProperty('clientName') ||
      !clientInfo.hasOwnProperty('cpf') ||
      !clientInfo.hasOwnProperty('address') ||
      !clientInfo.hasOwnProperty('cep') ||
      !clientInfo.hasOwnProperty('value')) {
    responseCode = 400
    errorMessage = 'Missing information.'
  } else if (clientInfo.cpf.toString().length !== 11) {
    responseCode = 400
    errorMessage = 'Wrong CPF.'
  } else if (clientInfo.cep.toString().length !== 8) {
    responseCode = 400
    errorMessage = 'Wrong CEP.'
  } else {
    code = Math.random().toString(36).substring(2)
  }

  // TODO: Generate document and add it status to the DB

  res.status(responseCode).send({
    code: code,
    errorMessage: errorMessage,
    documentRep: ''
  })
})

app.get('/payments/bankTicket/:code/status', (req, res) => {
  console.log(req.params.code)

  var status = ''
  var responseCode = 200

  // TODO: Check the status
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

app.post('/invoice', (req, res) => {
  var body = req.body
  console.log(body)

  var code = null
  var errorMessage = null
  var responseCode = 200

  if (!body.hasOwnProperty('clientData') ||
      !body.hasOwnProperty('products') ||
      !body.hasOwnProperty('paymentMethod') ||
      !body.hasOwnProperty('value') ||
      !body.hasOwnProperty('transportValue') ||
      !body.hasOwnProperty('discountValue') ||
      !body.hasOwnProperty('totalValue')) {
    responseCode = 400
    errorMessage = 'Missing information.'
  } else if (body.clientData.cpf.toString().length !== 11) {
    responseCode = 400
    errorMessage = 'Wrong CPF.'
  } else if (body.clientData.address.cep.toString().length !== 8) {
    responseCode = 400
    errorMessage = 'Wrong CEP.'
  } else {
    code = Math.random().toString(36).substring(2)
  }

  // TODO: Generate invoice document

  res.status(responseCode).send({
    invoiceCode: code,
    errorMessage: errorMessage,
    documentRep: ''
  })
})

app.post('/signup', function (req, res) {
  var body = req.body
  var responseCode = 200
  var errorMessage = null

  console.log(body)

  if (body.email && body.password && body.name && body.cpf && body.phone1) {
    var userData = {
      email: body.email,
      password: body.password
    }

    User.create(userData, function (error, user, next) {
      if (error) {
        console.log(error)
        if (error.code === 11000) {
          res.status(422).send({
            error: 'Email already registered.'
          })
        } else {
          res.status(error.code || 404).send({
            error: error
          })
        }

        return
      }

      var finalUserData = userData

      finalUserData.cpf = body.cpf
      finalUserData.phone1 = body.phone1
      if (body.phone2) finalUserData.phone2 = body.phone2
      if (body.cep) finalUserData.cep = body.cep
      if (body.sex) finalUserData.sex = body.sex
      if (body.birthday) finalUserData = body.birthday

      // TODO: send data to the Client 2 API and get the clientID
      // TODO: Set the client id from the db and the session id like the following line as:
      // !!! REMEMBER TO UPDATE THE /profile AND /login ENDPOINTS TO USE req.session.userID
      // User.update({email: body.email}, { clientID: clientID }, function (err, user) {
      //   if (err) {
      //     res.status(err.code || 404).send({
      //       error: err
      //     })
      //     return
      //   }

      //   req.session.userID = clientID
      //   res.redirect('/profile')
      // })

      req.session.userEmail = body.email
      res.redirect('/profile')
    })
  } else {
    responseCode = 400

    if (!body.password) {
      errorMessage = 'Missing password'
    } else if (!body.email) {
      errorMessage = 'Missing email.'
    } else {
      errorMessage = 'Missing other mandatory field.'
    }

    res.status(responseCode).send({
      errorMessage: errorMessage
    })
  }
})

app.post('/login', function (req, res) {
  var body = req.body
  var responseCode = 200
  var errorMessage = null

  if (body.email && body.password) {
    User.authenticate(body.email, body.password, function (err, user) {
      if (err || !user) {
        errorMessage = 'Wrong email or password'
        responseCode = 401
      }

      // req.session.userID = user.clientID
      // TODO: Delete the following line when working with the Client 2 API
      req.session.userEmail = body.email
      res.redirect('/profile')
    })
  } else {
    if (!body.password) {
      responseCode = 400
      errorMessage = 'Missing password'
    } else if (!body.email) {
      responseCode = 400
      errorMessage = 'Missing email.'
    }

    res.status(responseCode).send({
      errorMessage: errorMessage
    })
  }
})

app.get('/profile', function (req, res) {
  // var clientID = req.session.userID
  // TODO: Use the clientID to get the user from the Client 2 API

  User.findOne({email: req.session.userEmail})
    .exec(function (err, user) {
      if (err) {
        res.status(err.code || 404).send({
          error: err
        })
        return
      }

      if (user === null) {
        var error = new Error('Not authorized! Go back!')
        error.status = 400

        res.status(error.code || 404).send({
          error: error
        })
      } else {
        res.status(200).send(user)
      }
    })
})

app.get('/logout', function (req, res) {
  if (req.session) {
    // delete session object
    req.session.destroy(function (err) {
      if (err) {
        res.status(err.code || 404).send({
          error: err
        })
      } else {
        res.status(200).send('OK')
      }
    })
  }
})

app.listen(port, function () {
  console.log('Listening on port ' + port)
})
