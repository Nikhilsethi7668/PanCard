const { ObjectId } = require("mongodb");
const User = require("./userSchema");
const mongoose = require("mongoose");

const dataSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  panNumber: {
    type: String,
    unique: true,
    required: true,
  },
  email: {
    type: [String],
  },
});

module.exports = mongoose.model("Data", dataSchema);
