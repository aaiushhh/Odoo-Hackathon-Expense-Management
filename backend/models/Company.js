const mongoose = require("mongoose");
const { Schema } = require('mongoose');
const CompanySchema = new Schema({
    name: { type: String, required: true, unique: true, trim: true },
    country: { type: String, required: true, trim: true },
    currency: { type: String, required: true, trim: true, uppercase: true }, // e.g., USD, EUR
    adminId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
}, { timestamps: true });
const Company = mongoose.model("Company", CompanySchema);
module.exports = Company;
