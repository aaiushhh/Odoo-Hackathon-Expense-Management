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
  managerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', default: null } // New
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
