const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema({

userId:{
 type:mongoose.Schema.Types.ObjectId,
 ref:"User",
 required:true
},

ratedUserId:{
 type:mongoose.Schema.Types.ObjectId,
 ref:"User",
 required:true
},

rating:{
 type:Number,
 required:true
},

review:{
 type:String,
 default:""
},

// Which skill was learned from this user
skillLearned:{
 type:String,
 default:""
},

},{timestamps:true});

module.exports = mongoose.model("Rating",ratingSchema);