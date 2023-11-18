const mongoose = require('mongoose');

const conversionSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  fromAsset: { 
    type: String, 
    required: true 
  },
  toAsset: { 
    type: String, 
    required: true 
  },
  amountConverted: { 
    type: Number, 
    required: true 
  },
  amountReceived: { 
    type: Number, 
    required: true 
  },
  trxFee: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    default: 'pending' 
  },
  referral: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Referral',
    default: null,
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
});

const withdrawalSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  asset: { 
    type: String, 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  destinationAddress: { 
    type: String, 
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  status: { 
    type: String, 
    default: 'pending' 
  },
});

const depositSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  asset: { 
    type: String, 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  source: { 
    type: String, 
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
});

const Deposit = mongoose.model('Deposit', depositSchema);
const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);
const Conversion = mongoose.model('Conversion', conversionSchema);

module.exports = {
  Conversion,
  Withdrawal,
  Deposit
}
