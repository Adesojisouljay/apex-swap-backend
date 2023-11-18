const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  asset: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  memo: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Transfer = mongoose.model('Transfer', transferSchema);

module.exports = Transfer;
