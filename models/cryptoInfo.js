const mongoose = require('mongoose');

const cryptoPriceSchema = new mongoose.Schema({
  coinId: {
    type: String,
    required: true,
    unique: true,
  },
  symbol: {
    type: String,
    required: true,
    unique: true,
  },
  usdPrice: {
    type: Number,
    required: true,
  },
  percentageChange: {
    type: Number,
    required: true,
  },
  priceChange: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const CryptoInfo = mongoose.model('CryptoInfo', cryptoPriceSchema);

module.exports = CryptoInfo;
