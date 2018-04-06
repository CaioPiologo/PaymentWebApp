# PaymentWebApp
A simple payment web app made for the discipline MC851 in Unicamp.

## Preparations

First download or clone the repo. Then run at the root folder
```
npm install
```
in order to download and install any dependencies.

If you wish to use the server with the React Client also run
```
cd client
npm install
```

## Running

To run the server execute
```
npm run server
```
It should be accessible at [localhost:5000](http://localhost:5000) and in the current exemple, accessing [localhost:5000/api/hello](http://localhost:5000/api/hello) should return a body.

If running the entire application then execute
```
npm start
```
And the client should pop open in a browser at [localhost:3000](http://localhost:3000). Note that the server will still be accessible at [localhost:5000](http://localhost:5000)

## Deploying

TODO: Missing heroku-postbuild and build parts.
In order to deploy on Heroku server with the React client, we need to uncomment line 8 at [server.js](https://github.com/CaioPiologo/PaymentWebApp/blob/master/server.js) and then pushing to `heroku master` if already created.
```
git push heroku master
```
