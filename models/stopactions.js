const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const stopActionsSchema = new Schema({
    username: {
        type:String,
        required: true
    },
    session_id: {
        type:String,
        required: true
    }
}, {timestamps: true})

const StopAction = mongoose.model('StopAction', stopActionsSchema);
module.exports = StopAction;