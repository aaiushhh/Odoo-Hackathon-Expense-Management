const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  name: String,
  country: String,
  currency: String,
  adminId: mongoose.Schema.Types.ObjectId,
});
const Company = mongoose.model("Company", companySchema);
module.exports = Company;
