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

const axios = require('axios')
var client2API = axios.create({
  baseURL: 'https://gentle-waters-56547.herokuapp.com/api',
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  }
})

mongoose.connect('mongodb://mc851_payment:mc8512018@ds143362.mlab.com:43362/mc851_payment_service')
var db = mongoose.connection

db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function () {
  // we're connected!
})

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

  console.log('/signup')

  if (body.email && body.password && body.name && body.cpf && body.phone1) {
    var userData = {
      email: body.email,
      password: body.password
    }

    const email = body.email

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

      var finalUserData = {}

      finalUserData.name = body.name
      finalUserData.email = body.email
      finalUserData.password = body.password
      finalUserData.cpf = body.cpf
      finalUserData.phone1 = body.phone1
      if (body.phone2) finalUserData.phone2 = body.phone2
      if (body.cep) finalUserData.cep = body.cep
      if (body.sex) finalUserData.sex = body.sex
      if (body.birthday) finalUserData = body.birthday

      console.log(finalUserData)

      client2API.post('/client', finalUserData)
        .then(function (response) {
          console.log(response.data)

          if (response.data.hasOwnProperty('Client ID')) {
            const clientID = response.data['Client ID']
            console.log(clientID)

            User.findOneAndUpdate({email: email}, { clientID: clientID }, function (err, user) {
              if (err) {
                console.log('user not found...')
                res.status(err.code || 404).send({
                  error: err
                })
                return
              }

              console.log('User updated')
              
              req.session.userID = clientID
              res.redirect('/profile')
            })
          } else {
            console.log('No client id.')
            res.status(500).send({
              error: 'Internal error.'
            })
          }
        })
        .catch(function (err) {
          if (err.code === 11000) {
            res.status(422).send({
              error: 'Email already registered.'
            })
          } else {
            console.log(err.response.data)
            res.status(err.code || 404).send({
              error: err.response.data
            })
          }
        })

      // req.session.userEmail = body.email
      // res.redirect('/profile')
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

  console.log('/login')

  if (body.email && body.password) {
    User.authenticate(body.email, body.password, function (err, user) {
      if (err || !user) {
        errorMessage = 'Wrong email or password'
        responseCode = 401

        res.status(responseCode).send({
          errorMessage: errorMessage
        })
      } else {
        console.log(user)
        req.session.clientID = user.clientID
        res.redirect('/profile')
      }
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
  console.log('/profile')
  var error = new Error('Not authorized! Please, login first!')
  error.status = 400

  if (!req.session) {
    console.log('No session')
    res.status(error.status).send({
      error: error.message
    })

    return
  } else if (!req.session.clientID) {
    console.log('No client id')
    res.status(error.status).send({
      error: error.message
    })

    return
  }

  client2API.get('/client?clientid=' + req.session.clientID)
    .then(function (response) {
      console.log(response.data)
      if (response.data.data && response.data.data.length > 0) {
        const usrData = response.data.data[0]

        console.log(usrData)

        res.status(200).send(usrData)
      } else {
        res.status(404).send({
          error: 'User not found.'
        })
      }
    })
    .catch(function (err) {
      console.log('Not possible to fetch user.')
      res.status(err.code || 404).send({
        error: err.data
      })
    })
})

app.post('/user', function (req, res) {
  const userData = req.body.userData

  if (!userData.email) {
    console.log('Missing email!')
    res.status(401).send({
      error: 'Missing email!'
    })
  }

  if (userData.clientID) {
    User.findOneAndUpdate({email: userData.email}, userData, function (err, user) {
      if (err) {
        console.log('User not found...')
        res.status(404).send({
          error: 'User not found'
        })
        return
      }

      console.log('User updated!')
      res.status(200).send(user)
    })
  }
})

app.delete('/user/:userID', function (req, res) {
  const clientID = req.params.userID

  console.log('DELETE user with client id: ' + clientID)

  User.findOneAndRemove({ clientID: clientID }, function (err) {
    if (err) {
      res.status(err.code || 404).send({
        error: err
      })
    } else {
      res.status(200).send('OK')
    }
  })
})

app.delete('/user/:email', function (req, res) {
  const email = req.params.email

  console.log('DELETE user with email: ' + email)

  User.findOneAndRemove({ email: email }, function (err, result) {
    console.log(err, result)
    if (err) {
      res.status(err.code || 404).send({
        error: err
      })
    } else {
      res.status(200).send('OK')
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
