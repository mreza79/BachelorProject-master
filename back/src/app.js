const express = require("express");
require("./db/mongoose");
const userRouter = require("./routers/user");
const bodyParser = require("body-parser");
// const passport = require('passport-google-oauth20')

const app = express();

var allowCrossDomain = function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header("Access-Control-Allow-Headers", ["Content-Type", "Authorization"]);
  // res.header("Access-Control-Allow-Headers", "Authorization");
  next();
};

app.use(express.json());
app.use(allowCrossDomain);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
// in latest body-parser use like below.
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(passport.initialize())
app.use(userRouter);

module.exports = app;
