const mongoose = require("mongoose");

const dataSchema = new mongoose.Schema({
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
