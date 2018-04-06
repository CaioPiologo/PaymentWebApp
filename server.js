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

app.post('/payments/creditCard', (req, res) => {
   //receive stuff from require (req)
   var name = req.body.name;
   console.log(name);


   //do stuff with it (buy with some api)

   //then return any response if needed
   res.send({card_name: name});
});

app.post('/quotes', (req, res) => {

   db.collection('quotes').save(req.body, (err, result) => {
      if (err) return console.log(err)

      console.log('saved to database')
      res.redirect('/')
   })
})

// app.listen(port, () => console.log(`Listening on port ${port}`));
