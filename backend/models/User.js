const mongoose = require("mongoose");

const UserSchema = new Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false }, // Don't return password by default
    role: { 
        type: String, 
        enum: ['Admin', 'Manager', 'Employee'], 
        required: true 
    },
    companyId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Company', 
        required: true 
    },
    managerId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        default: null // Only employees and managers report to someone
    },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

module.exports = User;
