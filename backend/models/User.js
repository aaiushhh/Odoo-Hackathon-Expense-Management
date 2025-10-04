const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  companyId: mongoose.Schema.Types.ObjectId,
  managerId: mongoose.Schema.Types.ObjectId,
});

const User = mongoose.model("User", userSchema);

module.exports = User;
