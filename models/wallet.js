const mongoose = require('mongoose');

const walletAssetSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    required: true,
  },
  userMemo: {
    type: String,
    required: true,
  },
  privateKey: {
    type: String,
    required: false,
  },
});

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assets: [walletAssetSchema],
});

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
