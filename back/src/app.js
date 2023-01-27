const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user')
// const passport = require('passport-google-oauth20')

const app = express()

app.use(express.json())
// app.use(passport.initialize())
app.use(userRouter)

module.exports = app
