const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    enum: ["drafza1", "drafza2", "drafza3"], // Only these 3 accounts allowed
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },
  location: { 
    type: String, 
    required: true,
    enum: ["pkns", "kipmall", "spare"]
  },
  displayName: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ["staff", "admin"], 
    default: "staff" 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("User", userSchema);