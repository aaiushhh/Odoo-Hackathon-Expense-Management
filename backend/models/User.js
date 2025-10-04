const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { 
    type: String, 
    enum: ['Admin', 'Manager', 'Employee'], 
    required: true 
  },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  companyCurrency: { type: String, default: 'USD', uppercase: true },
  managerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
  phone: { type: String, trim: true }, // Add phone field
  department: { type: String, trim: true } // Add department field
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
