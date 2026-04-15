const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content:  { type: String, default: "" },
  fileUrl:  { type: String, default: "" },
  fileName: { type: String, default: "" },
  fileSize: { type: Number, default: 0 },
  fileType: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);