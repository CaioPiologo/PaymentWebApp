const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

/* Uncomment this line to use the server with the react application */
// app.use(express.static(path.join(__dirname, 'client/build')));

app.get('/api/hello', (req, res) => {
  res.send({ express: 'Hello World' });
});

app.post('/payments/creditCard', (req, res) => {
   //receive stuff from require (req)
   var name = req.param('name');


   //do stuff with it (buy with some api)

   //then return any response if needed
   res.send({card_name: name});
});

app.listen(port, () => console.log(`Listening on port ${port}`));
