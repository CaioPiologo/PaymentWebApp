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
npm start
```
It should be accessible at [localhost:5000](http://localhost:5000) and in the current exemple, accessing [localhost:5000/api/hello](http://localhost:5000/api/hello) should return a body.

## Deploying

In order to deploy on Heroku server with the React client, we need to uncomment line 8 at [server.js](https://github.com/CaioPiologo/PaymentWebApp/blob/master/server.js) and then pushing to `heroku master` if already created.
```
git push heroku master
```
