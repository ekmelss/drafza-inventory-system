const mongoose = require("mongoose");

const typeSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
});

module.exports = mongoose.model("Type", typeSchema);
