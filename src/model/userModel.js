const mongoose = require('mongoose')
//const ObjectId = mongoose.SchemaTypes.ObjectId

const userSchema = new mongoose.Schema({
    fname: {type: String, required: true, trim: true},
    lname: {type: String, required: true, trim: true},
    email: {type: String, required: true, unique:true, trim: true, lowercase: true},
    phone: {type: String, unique:true, trim: true}, 
    password: {type: String, required: true}, // encrypted password
    creditScore: {type: Number, required: true, default: 500},
},
    {timestamps:true})

const userModel = mongoose.model('User', userSchema)//users

module.exports = {userModel}