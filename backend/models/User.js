const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true, select: false }, // Don't return password by default
    role: {
      type: String,
      enum: ["Admin", "Manager", "Employee", "Director", "CFO"],
      required: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
