const mongoose = require('mongoose')
const ObjectId = mongoose.SchemaTypes.ObjectId

const questionSchema = new mongoose.Schema({ 
    description: {type: String, required: true, trim:true},
    tag: [String],
    askedBy: {type: ObjectId, ref: 'User', required: true},
    deletedAt: {type: Date}, 
    isDeleted: {type: Boolean, default: false},
},
    {timestamps:true})

module.exports = mongoose.model('Question', questionSchema)//questions