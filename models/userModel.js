const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  navn: { type: String, required: true },
  epost: { type: String, required: true, unique: true },
  passord: { type: String, required: true },
  isAdmin: { type: Boolean, default: false }
});

module.exports = mongoose.model('user', userSchema);