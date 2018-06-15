const express = require('express')
const path = require('path')

const app = express()
const bodyParser = require('body-parser')
const port = process.env.PORT || 5000

const MongoClient = require('mongodb').MongoClient
const User = require('./model/user')
const BankTicket = require('./model/bankTicket')
const CreditCard = require('./model/creditCard')
const Purchase = require('./model/purchase')
var mongoose = require('mongoose')
var session = require('express-session')
var MongoStore = require('connect-mongo')(session)

const creditService = require('./services/creditServices')
const clientService = require('./services/clientServices')

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

app.post('/creditCard', function (req, res) {
  var cardInfo = req.body
  var response = {}
  var responseCode = 200

  if (cardInfo.number && (cardInfo.hasCredit != null)) {
    if (cardInfo.number.toString().length === 16) {
      CreditCard.create(cardInfo, function (err, creditCard) {
        if (err) {
          if (err.code === 11000) {
            response.errorMessage = 'Number already exists.'
            responseCode = 422
          }
        } else {
          response.creditCard = {
            number: creditCard.number,
            hasCredit: creditCard.hasCredit,
            id: creditCard._id
          }
        }

        res.status(responseCode).send(response)
      })

      return
    } else {
      responseCode = 400
      response.errorMessage = 'Incorrect card number.'
    }
  } else {
    responseCode = 400
    response.errorMessage = 'Missing information.'
  }
  
  res.status(responseCode).send(response)
})

app.get('/creditCard/', function (req, res) {
  var responseCode = 200
  var response = {}

  CreditCard.find({}, function (err, creditCards) {
    if (err) {
      console.log(err)
      responseCode = 500
      response.errorMessage = 'Internal server error.'
    } else {
      response.creditCards = creditCards.map(function (creditCard) {
        return {
          number: creditCard.number,
          hasCredit: creditCard.hasCredit,
          id: creditCard._id
        }
      })
    }

    res.status(responseCode).send(response)
  })
})

app.get('/creditCard/:number', function (req, res) {
  var response = {}
  var responseCode = 200
  
  CreditCard.findOne({ number: req.params.number }, function (err, creditCard) {
    if (err) {
      responseCode = 404
      response.errorMessage = 'Credit card with ' + req.params.number + ' not found.'
    } else {
      response.creditCard = {
        number: creditCard.number,
        hasCredit: creditCard.hasCredit,
        id: creditCard._id
      }
    }

    res.status(responseCode).send(response)
  })
})

/// Check the informations, (in the future contact the credit module) and return the payment status
app.post('/payments/creditCard', (req, res) => {
  // receive stuff from require (req)
  var clientInfo = req.body
  console.log(clientInfo)

  if (clientInfo.hasOwnProperty('clientCardName') &&
      clientInfo.hasOwnProperty('cpf') &&
      clientInfo.hasOwnProperty('cardNumber') &&
      clientInfo.hasOwnProperty('month') &&
      clientInfo.hasOwnProperty('year') &&
      clientInfo.hasOwnProperty('securityCode') &&
      clientInfo.hasOwnProperty('value') &&
      clientInfo.hasOwnProperty('instalments')) {
    var response = {}
    var responseCode = 200

    if (clientInfo.cpf.toString().length !== 11) {
      responseCode = 400
      response.errorMessage = 'Wrong CPF.'
    } else if (clientInfo.cardNumber.toString().length !== 16) {
      responseCode = 400
      response.errorMessage = 'Wrong card number.'
    } else {
      creditService.isCPFAuth(clientInfo.cpf, function (err, isAuth) {
        if (err) {
          responseCode = 400
          response.errorMessage = err
        } else if (isAuth === null) {
          responseCode = 500
          response.errorMessage = 'Internal server error.'
        } else {
          if (isAuth) {
            CreditCard.findOne({number: clientInfo.cardNumber}, function (err, creditCard) {
              if (err) {
                responseCode = 500
                response.errorMessage = 'Internal server error.'
              } else if (!creditCard) {
                response.result = 'AUTHORIZED'
                response.opHash = Math.random().toString(36).substring(2)
                response.detail = 'Credit card not registered.'
              } else {
                if (creditCard.hasCredit) {
                  response.result = 'AUTHORIZED'
                  response.opHash = Math.random().toString(36).substring(2)
                } else {
                  response.result = 'UNAUTHORIZED'
                  response.detail = 'No credit.'
                }
              }

              res.status(responseCode).send(response)
            })
            return
          } else {
            response.result = 'UNAUTHORIZED'
            response.detail = 'Low credit score.'
          }
        }

        res.status(responseCode).send(response)
      })
      return
    }

    res.status(400).send(response)
  } else {
    // then return any response if needed
    res.status(400).send({
      errorMessage: 'Missing information.'
    })
  }
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
    creditService.isCPFAuth(clientInfo.cpf, function (err, isAuth) {
      console.log(isAuth)

      var response = {}

      if (err) {
        responseCode = 400
        response.errorMessage = err
        res.status(responseCode).send(response)
      } else if (isAuth === null) {
        responseCode = 500
        response.errorMessage = 'Internal server error.'
        res.status(responseCode).send(response)
      } else {
        if (isAuth) {
          const bankTicketData = {
            cpf: clientInfo.cpf,
            status: 3
          }

          BankTicket.create(bankTicketData, function (error, bankTicket, next) {
            if (error) {
              console.log(error)
              responseCode = 500
              response.errorMessage = 'Internal server error.'
            } else {
              response.docRep = Math.random().toString(36).substring(2)
              response.code = bankTicket._id
              response.result = 'AUTHORIZED'

              setTimeout(() => {
                var newStatus = Math.floor(Math.random() * 10)

                if (newStatus <= 8) {
                  newStatus = 1
                } else {
                  newStatus = 2
                }

                console.log('Updating bank ticket: ' + bankTicket._id)
                console.log('New status: ' + newStatus)

                BankTicket.findByIdAndUpdate(bankTicket._id, { status: newStatus }, { new: true }, function (err, updatedBankTicket) {
                  if (err) {
                    console.log(err)
                  } else {
                    console.log(updatedBankTicket)
                  }
                })
              }, 60000)
            }

            res.status(responseCode).send(response)
          })
        } else {
          response.result = 'UNAUTHORIZED'
          response.detail = 'Low credit score.'
          res.status(responseCode).send(response)
        }
      }
    })

    return
  }

  res.status(responseCode).send({
    errorMessage: errorMessage
  })
})

app.get('/payments/bankTicket/:code/status', (req, res) => {
  if (!req.params.code) {
    res.status(400).send({
      errorMessage: 'Missing code.'
    })

    return
  }

  console.log(req.params.code)

  const code = req.params.code
  var response = {}
  var responseCode = 200

  response.code = code

  BankTicket.findOne({ _id: code }, function (err, bankTicket) {
    var ticketStatus = 0

    if (err) {
      console.log(err)
    } else {
      console.log(bankTicket)
      ticketStatus = bankTicket.status
    }

    switch (ticketStatus) {
      case 1:
        response.status = 'OK'
        break
      case 2:
        response.status = 'EXPIRED'
        break
      case 3:
        response.status = 'PENDING_PAYMENT'
        break
      default:
        response.status = 'NOT_FOUND'
        responseCode = 404
        break
    }

    res.status(responseCode).send(response)
  })
})

app.post('/invoice', (req, res) => {
  var body = req.body
  console.log(body)

  var response = {}
  var responseCode = 200

  if (!body.hasOwnProperty('clientData') ||
      !body.hasOwnProperty('products') ||
      !body.hasOwnProperty('value') ||
      !body.hasOwnProperty('transportValue') ||
      !body.hasOwnProperty('discountValue') ||
      !body.hasOwnProperty('totalValue')) {
    responseCode = 400
    response.errorMessage = 'Missing information.'
  } else if (body.clientData.cpf.toString().length !== 11) {
    responseCode = 400
    response.errorMessage = 'Wrong CPF.'
  } else if (body.clientData.address.cep.toString().length !== 8) {
    responseCode = 400
    response.errorMessage = 'Wrong CEP.'
  } else {
    response.code = Math.random().toString(36).substring(2)
    response.documentRep = ''
  }

  // TODO: Generate invoice document

  res.status(responseCode).send(response)
})

app.post('/signup', function (req, res) {
  var body = req.body
  var responseCode = 200
  var errorMessage = null

  console.log('/signup')
  console.log(body)

  if (body.email && body.password && body.name && body.cpf && body.phone1) {
    clientService.insertUser(body, function (err, user) {
      if (err) {
        res.status(err.code).send(err.error)
      } else {
        req.session.clientID = user.clientID
        req.session.save()
        clientService.getUser(user.clientID, function (err, user) {
          if (err) {
            res.status(err.code).send(err.error)
          } else {
            user.clientID = req.session.clientID
            res.status(200).send(user)
          }
        })
      }
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
    console.log(errorMessage)
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
        req.session.save()
        clientService.getUser(user.clientID, function (err, user) {
          if (err) {
            res.status(err.code).send(err.error)
          } else {
            user.clientID = req.session.clientID
            res.status(200).send(user)
          }
        })
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

  clientService.getUser(req.session.clientID, function (err, user) {
    if (err) {
      res.status(err.code).send(err.error)
    } else {
      user.clientID = req.session.clientID

      Purchase.find({clientID: req.session.clientID}, function (err, purchases) {
        if (err) {
          res.status(500).send({errorMessage: 'Internal server error.'})
        } else {
          user.purchases = purchases.map(function (purchase) {
            return {
              products: purchase.products,
              trackingNumber: purchase.trackingNumber,
              clientID: purchase.clientID,
              id: purchase._id,
              totalAmount: purchase.totalAmount
            }
          })

          res.status(200).send(user)
        }
      })
    }
  })
})

app.post('/user', function (req, res) {
  const userData = req.body

  console.log(userData)

  var responseCode = 200
  var response = {}

  if (userData.email && userData.clientID && userData.password) {
    User.create(userData, function (err, user) {
      if (err) {
        if (err.code === 11000) {
          response.errorMessage = 'Email already registered'
          responseCode = 422
        } else {
          responseCode = err.code || 404
          response.errorMessage = err
        }

        res.status(responseCode).send(response)
      } else {
        res.status(responseCode).send(user)
      }
    })
  } else {
    responseCode = 400
    response.errorMessage = 'Missing parameter.'

    res.status(responseCode).send(response)
  }
})

app.put('/user', function (req, res) {
  const userData = req.body

  if (!userData.email) {
    console.log('Missing email!')
    res.status(401).send({
      error: 'Missing email!'
    })
  }

  User.findOneAndUpdate({ email: userData.email },
    userData,
    { new: true },
    function (err, user) {
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
})

app.post('/user/:clientID/purchase', function (req, res) {
  const clientID = req.params.clientID
  const body = req.body

  var responseCode = 200
  var response = {}

  if (body.trackingNumber && body.products) {
    const badFormatedProd = body.products.find(function (prod) { return !prod.productID || !prod.amount })
    console.log(badFormatedProd)

    if (badFormatedProd) {
      responseCode = 400
      response.errorMessage = 'Missing parameter for product.'

      res.status(responseCode).send(response)
      return
    }

    var newPurchase = {
      clientID: clientID,
      trackingNumber: body.trackingNumber,
      products: body.products
    }

    if (body.bankTicketID) {
      newPurchase.bankTicketID = body.bankTicketID
    }

    if (body.totalAmount) {
      newPurchase.totalAmount = body.totalAmount
    }

    Purchase.create(newPurchase, function (err, purchase) {
      if (err) {
        if (err.code === 11000) {
          response.errorMessage = 'Purchase already registered'
          responseCode = 422
        } else {
          responseCode = err.code || 404
          response.errorMessage = err
        }

        res.status(responseCode).send(response)
      } else {
        User.findOneAndUpdate({ clientID: clientID },
          { $push: { purchases: purchase._id } },
          { new: true },
          function (err, user) {
            if (err) {
              responseCode = err.code || 404
              response.errorMessage = err
            } else {
              response = user
            }

            res.status(responseCode).send(response)
          })
      }
    })
  } else {
    responseCode = 400
    response.errorMessage = 'Missing parameter.'

    res.status(responseCode).send(response)
  }
})

app.get('/user/:clientID', function (req, res) {
  const clientID = req.params.clientID

  clientService.getUser(clientID, function (err, user) {
    if (err) {
      res.status(err.code).send(err.error)
    } else {
      user.clientID = req.session.clientID

      Purchase.find({clientID: clientID}, function (err, purchases) {
        if (err) {
          res.status(500).send({errorMessage: 'Internal server error.'})
        } else {
          user.purchases = purchases.map(function (purchase) {
            return {
              products: purchase.products,
              trackingNumber: purchase.trackingNumber,
              clientID: purchase.clientID,
              id: purchase._id,
              totalAmount: purchase.totalAmount,
              bankTicketID: purchase.bankTicketID,
            }
          })

          res.status(200).send(user)
        }
      })
    }
  })
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
    if (err || !result) {
      res.status(404).send({
        errorMessage: 'Not found'
      })
    } else {
      res.status(200).send('OK')
    }
  })
})

app.get('/user', function (req, res) {
  var responseCode = 200
  var response = {}

  User.find({}, function (err, users) {
    if (err) {
      console.log(err)
      responseCode = 500
      response.errorMessage = 'Internal server error.'
    } else {
      response.users = users.map(function (user) {
        return {
          email: user.email,
          clientID: user.clientID,
          purchases: user.purchases
        }
      })
    }

    res.status(responseCode).send(response)
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

app.get('/purchase/:id', function (req, res) {
  const id = req.params.id

  Purchase.findById(id, function (err, purchase) {
    if (err || !purchase) {
      res.status(404).send({
        error: 'Not found.'
      })
    } else {
      var finalPurchase = {
        products: purchase.products,
        trackingNumber: purchase.trackingNumber,
        clientID: purchase.clientID,
        id: purchase._id,
        totalAmount: purchase.totalAmount
      }

      if (purchase.bankTicketID) {
        finalPurchase.bankTicketID = purchase.bankTicketID
      }

      res.status(200).send(finalPurchase)
    }
  })
})

app.delete('/purchase/:id', function (req, res) {
  Purchase.findByIdAndRemove(req.params.id, function (err, result) {
    console.log(err, result)
    if (err) {
      res.status(500).send({ errorMessage: 'Internal server error.' })
    } else {
      res.status(200).send('OK')
    }
  })
})

app.listen(port, function () {
  console.log('Listening on port ' + port)
})
