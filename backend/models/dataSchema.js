const mongoose = require("mongoose");

const dataSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  panNumber: {
    type: String,
    required: true,
  },
  email: {
    type: [String],
    default: [],
  },
});

module.exports = mongoose.model("Data", dataSchema);
