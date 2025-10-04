// backend/src/models/User.js (CORRECTED)

const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
    // ... (other fields)
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: { 
        type: String, 
        enum: ['Admin', 'Manager', 'Employee'], 
        required: true 
    },
    companyId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Company', 
        // REMOVE: required: true, 
    }, // It will be added in the transaction immediately after Company creation
    managerId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        default: null
    },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);