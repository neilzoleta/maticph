const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  preferredName: String,
  firstName: String,
  lastName: String,
  position: String,
  department: String,
  admin: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

module.exports = mongoose.model('User', userSchema);