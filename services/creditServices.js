const axios = require('axios')

var creditAPI = axios.create({
  baseURL: 'https://glacial-brook-98386.herokuapp.com',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'tmvcgp3'
  }
})

module.exports = {
  isCPFAuth: function (cpf, callback) {
    console.log('Checking score...')

    creditAPI.get('/score/' + cpf.toString())
      .then(function (response) {
        if (response.data.score) {
          const isGoodScore = response.data.score >= 400
          callback(null, isGoodScore)
        } else {
          callback(null)
        }
      })
      .catch(function (err) {
        console.log(err.response.data.detail)

        if (err.response.status === 404) {
          creditAPI.post('/score/' + cpf.toString(), { score: 500 })
            .then(function (response2) {
              callback(null, true)
            })
            .catch(function (err) {
              console.log(err.response.data.detail)

              if (err.response.status === 400) {
                callback(err.response.data.detail)
              } else {
                console.log('Unknown error.')

                callback(null)
              }
            })
        } else if (err.response.status === 400) {
          callback(err.response.data.detail, null)
        } else {
          console.log('Unknown error.')

          callback(null)
        }
      })
  }
}
