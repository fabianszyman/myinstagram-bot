const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const actionsSchema = new Schema({
    username: {
        type:String,
        required: true
    },
    searchTerms: {
        type:[String],
        required: true
    },
    session_id: {
        type:String,
        required: true
    },
    seachTermUsed: {
        type:String,
        required:true
    },
    amountOfActionsDone:{
        type:Number,
        required:true
    },
    actionType: {
        type:String,
        required: true
    },
    userData: {
        username: {
            type:String,
            required:true
        },
        url: {
            type:String,
            required:true 
        },
        urlOfCertainPost: {
            type:String,
            required:false
        },
        amount_of_posts: {
            type:Number,
            required:false
        },
        amount_of_followers: {
            type:Number,
            required:false
        },
        amount_of_people_user_follows: {
            type:Number,
            required:false
        }
    }

}, {timestamps: true})

const Action = mongoose.model('action', actionsSchema);
module.exports = Action;