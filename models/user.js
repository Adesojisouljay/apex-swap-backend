const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  profilePicture: {
    type: String,
    default: 'default.jpg',
  },
  userMemo: {
    type: String,
    unique: true,
  },
  resetToken: {
    type: String,
    default: null,
  },
  tokenExpiration: {
    type: Date,
    default: null,
  },
  referralCode: {
    type: String,
    unique: true,
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
