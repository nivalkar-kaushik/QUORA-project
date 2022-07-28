const express = require('express')
const mongoose = require('mongoose')
const app = express()
const route = require('./route/router')
const port = process.env.PORT || 3000
const dbUrl = 'mongodb+srv://goblin797:Monkey721@cluster0.skwvd.mongodb.net/kaushik1234?retryWrites=true&w=majority'

app.use(express.json())
app.use(express.urlencoded({extended:true}))

mongoose.connect(dbUrl, {useNewUrlParser: true})
.then(() => console.log('mongoose is connected'))
.catch(err => console.log(err.message))

app.use(route)

app.listen(port, () =>{
    console.log(`Express app ruuning on PORT: ${port}`)
})