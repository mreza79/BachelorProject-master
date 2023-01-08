const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user')

const app = express()

app.use(express.json())
app.use('/user', userRouter)

module.exports = app
