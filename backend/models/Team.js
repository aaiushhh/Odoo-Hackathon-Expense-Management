const mongoose = require("mongoose");
const { Schema } = mongoose;

const TeamSchema = new Schema({
  name: { type: String, required: true },
  managerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }] // employees
});

const Team = mongoose.model("Team", TeamSchema);
module.exports = Team;
