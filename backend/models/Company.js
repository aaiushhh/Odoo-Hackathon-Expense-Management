const mongoose = require("mongoose");
<<<<<<< HEAD
const { Schema } = require('mongoose');
const CompanySchema = new Schema({
    name: { type: String, required: true, unique: true, trim: true },
    country: { type: String, required: true, trim: true },
    currency: { type: String, required: true, trim: true, uppercase: true }, // e.g., USD, EUR
    address: { type: String, trim: true }, // Add address field
    adminId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
}, { timestamps: true });
=======
const { Schema } = mongoose;
const CompanySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    country: { type: String, required: true, trim: true },
    currency: { type: String, required: true, trim: true, uppercase: true }, // e.g., USD, EUR
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);
>>>>>>> 763fc7dbfb2a8fa88285739a062288fa22ad2b2e
const Company = mongoose.model("Company", CompanySchema);
module.exports = Company;
