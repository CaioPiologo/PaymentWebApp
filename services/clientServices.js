const axios = require('axios')
const User = require('../model/user')

var client2API = axios.create({
  baseURL: 'https://gentle-waters-56547.herokuapp.com/api',
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  }
})

module.exports = {
  getUser: function (clientID, callback) {
    var error = null
    var usrData = null

    client2API.get('/client?clientid=' + clientID)
      .then(function (response) {
        console.log(response.data)
        if (response.data.data && response.data.data.length > 0) {
          usrData = response.data.data[0]

          console.log(usrData)
        } else {
          error.code = 404
          error.error = 'User not found.'
        }

        callback(error, usrData)
      })
      .catch(function (err) {
        console.log('Not possible to fetch user.')

        error.code = err.code || 404
        error.error = err.data

        callback(error)
      })
  },

  insertUser: function (fullUserData, callback) {
    var error = null
    var userData = {
      email: fullUserData.email,
      password: fullUserData.password
    }

    const email = fullUserData.email

    User.create(userData, function (err1, user, next) {
      if (err1) {
        console.log(err1)

        error = {}

        if (err1.code === 11000) {
          error.code = 422
          error.error = 'Email already registered.'
        } else {
          console.log(err1)

          error.code = err1.code || 404
          error.error = err1
        }

        callback(error)

        return
      }

      var finalUserData = {}

      finalUserData.name = fullUserData.name
      finalUserData.email = fullUserData.email
      finalUserData.password = fullUserData.password
      finalUserData.cpf = fullUserData.cpf
      finalUserData.phone1 = fullUserData.phone1
      if (fullUserData.phone2) finalUserData.phone2 = fullUserData.phone2
      if (fullUserData.cep) finalUserData.cep = fullUserData.cep
      if (fullUserData.sex) finalUserData.sex = fullUserData.sex
      if (fullUserData.birthday) finalUserData.birthday = fullUserData.birthday

      console.log(finalUserData)

      client2API.post('/client', finalUserData)
        .then(function (response) {
          console.log(response.data)

          if (response.data.hasOwnProperty('Client ID')) {
            const clientID = response.data['Client ID']
            console.log(clientID)

            User.findOneAndUpdate({email: email},
              { clientID: clientID },
              { new: true },
              function (err, user) {
                if (err) {
                  console.log('user not found...')
                  error = {}
                  error.code = err.code || 404
                  error.error = err
                } else {
                  console.log('User updated')
                  console.log(clientID)
                }

                callback(error, user)
              })
          } else {
            console.log('No client id.')
            error = {}
            error.code = 500
            error.error = 'Internal error'

            callback(error)
          }
        })
        .catch(function (err) {
          error = {}

          if (err.code === 11000) {
            error.code = 422
            error.error = 'Email already registered.'
          } else {
            console.log(err.response.data)

            error.code = err.code || 404
            error.error = err.response.data
          }

          callback(error)
        })
    })
  }
}
