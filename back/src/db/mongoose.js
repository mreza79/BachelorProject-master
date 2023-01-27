const mongoose = require('mongoose')

console.log(process.env.MONGODB_URL)

mongoose.connect(process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/final-project", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
})
