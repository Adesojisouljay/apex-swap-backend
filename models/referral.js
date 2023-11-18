const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  referredUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bonusAmount: {
    type: Number,
    default: 0,
    // required: true,
  },
  status: {
    type: String,
    default: 'awarded',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Referral = mongoose.model('Referral', referralSchema);

module.exports = Referral;
