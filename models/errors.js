const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const errorsSchema = new Schema({
    username: {
        type:String,
        required: true
    },
    session_id: {
        type:String,
        required: true
    },
    errorInfo:{
        type:String,
        required:false
    }
}, {timestamps: true})

const Error = mongoose.model('Error', errorsSchema);
module.exports = Error;