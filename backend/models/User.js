const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

  name:{
    type:String,
    required:true
  },

  email:{
    type:String,
    required:true,
    unique:true
  },

  password:{
    type:String,
    required:true
  },

  phone:{
    type:String,
    default:""
  },

  bio:{
    type:String,
    default:""
  },

  skillsOffered:{
    type:[String],
    default:[]
  },

  skillsWanted:{
    type:[String],
    default:[]
  },

  // Verified skills — approved by admin
  verifiedSkills:{
    type:[String],
    default:[]
  },

  // Profile picture
  avatar:{
    type:String,
    default:""
  },

},{timestamps:true});

module.exports = mongoose.model("User",userSchema);