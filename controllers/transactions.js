const { Withdrawal, Deposit, Conversion } = require('../models/transaction');
const Wallet = require('../models/wallet');
const User = require('../models/user');
const Transfer = require('../models/transfer');
const Profit = require('../models/profit');
const Referral = require('../models/referral');

const { handleConversion } = require('../helpers/conversionHandler');

const HIVE_TO_USDT_RATE = 0.225;
const HBD_TO_USDT_RATE = 0.98;
const TRANSACTION_FEE_RATE = 0.02;
const REFERRAL_BONUS_RATE = 0.002;
 
const deposit = async (req, res) => {
  try {
    const { user, asset, amount, source } = req.body;

    const userWallet = await Wallet.findOne({ user });
    const assetEntry = userWallet.assets.find((a) => a.type === asset);

    if (!assetEntry) {
      userWallet.assets.push({
        type: asset,
        address: 'YOUR_ADDRESS_HERE', 
        balance: 0,
        userMemo: 'Deposit Asset',
      });
    }

    const updatedAssetEntry = userWallet.assets.find((a) => a.type === asset);
    updatedAssetEntry.balance += amount;

    const deposit = new Deposit({
      user,
      asset,
      amount,
      source,
    });

    await Promise.all([userWallet.save(), deposit.save()]);

    res.json({ success: true, message: 'Deposit recorded' });
  } catch (error) {
    console.error('Error recording deposit:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

const withdrawal = async (req, res) => {
    const { username, asset, amount, destinationAddress, memo } = req.body;

    try {
      const user = await User.findOne({ username });
    
      if (!user) {
        return res.status(400).json({ success: false, error: 'User not found' });
      }
    
      const userWallet = await Wallet.findOne({ user: user._id });
    
      if (!userWallet) {
        return res.status(400).json({ success: false, error: 'User wallet not found' });
      }
    
      // Check if the user has sufficient balance for the withdrawal
      const assetEntry = userWallet.assets.find((a) => a.type === asset);
    
      if (!assetEntry || assetEntry.balance < amount) {
        return res.status(400).json({ success: false, error: 'Insufficient balance' });
      }
    
      // If the asset is Hive or HBD, require a memo
      if ((asset === 'Hive' || asset === 'HBD') && !memo) {
        return res.status(400).json({ success: false, error: 'Memo is required for Hive or HBD withdrawals' });
      }
    
      // Deduct the withdrawal amount from the user's balance
      assetEntry.balance -= amount;
    
      // Create a withdrawal record
      const withdrawal = new Withdrawal({
        user: user._id, // Use the user's ObjectId
        asset,
        amount,
        destinationAddress,
        memo, // Include memo if provided
      });
    
      // Save the updated wallet and withdrawal record
      await Promise.all([userWallet.save(), withdrawal.save()]);
    
      res.json({ success: true, message: 'Withdrawal processed' });
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
    
};

//get transaction history
const getTransactionHistory = async (req, res) => {
    try {
        const { username } = req.params;

        // Find the user by username
        const user = await User.findOne({ username });

        if (!user) {
        return res.status(400).json({ success: false, error: 'User not found' });
        }

        // Fetch user's transaction history (withdrawals, deposits, conversions, transfers)
        const withdrawalHistory = await Withdrawal.find({ user: user._id });
        const depositHistory = await Deposit.find({ user: user._id });
        const conversionHistory = await Conversion.find({ user: user._id });
        const transferHistory = await Transfer.find({ $or: [{ sender: user._id }, { recipient: user._id }] });

        // Combine all transaction history into one array
        const accountHistory = [
        ...withdrawalHistory.map((item) => ({ ...item.toObject(), type: 'withdrawal' })),
        ...depositHistory.map((item) => ({ ...item.toObject(), type: 'deposit' })),
        ...conversionHistory.map((item) => ({ ...item.toObject(), type: 'conversion' })),
        ...transferHistory.map((item) => ({ ...item.toObject(), type: 'transfer' })),
        ];

        // Sort the account history by timestamp
        accountHistory.sort((a, b) => b.timestamp - a.timestamp);

        res.json({ success: true, accountHistory });
    } catch (error) {
        console.error('Error fetching account history:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

const convertAssets = async (req, res) => {
  try {
    const { username, fromAsset, toAsset, amount } = req.body;

    console.log(req.user.username)
    console.log(username)

    if (req.user.username !== username) {
      return res.status(403).json({ success: false, error: 'You are not authenticated' });
    }

    // Find the user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check if the user has sufficient balance for the conversion
    const userWallet = await Wallet.findOne({ user });

    const fromAssetEntry = userWallet.assets.find((a) => a.type === fromAsset);
    const toAssetEntry = userWallet.assets.find((a) => a.type === toAsset);

    if (!fromAssetEntry || !toAsset || !amount) {
      return res.status(400).json({ success: false, error: 'Invalid request parameters' });
    }

    if (fromAssetEntry.balance < amount) {
      return res.status(400).json({ success: false, error: 'Insufficient balance for conversion' });
    }

    // Calculate the conversion result based on the specified rates
    let conversionRate;
    if (fromAsset === 'Hive' && toAsset === 'USDT') {
      conversionRate = HIVE_TO_USDT_RATE;
    } else if (fromAsset === 'HBD' && toAsset === 'USDT') {
      conversionRate = HBD_TO_USDT_RATE;
    } else if (fromAsset === 'USDT' && toAsset === 'Hive') {
      conversionRate = 1 / HIVE_TO_USDT_RATE; // Reverse conversion for USDT to HIVE
    } else if (fromAsset === 'USDT' && toAsset === 'HBD') {
      conversionRate = 1 / HBD_TO_USDT_RATE; // Reverse conversion for USDT to HBD
    } else {
      return res.status(400).json({ success: false, error: 'Invalid conversion pair' });
    }

    const convertedAmount = amount * conversionRate;

    // Apply the transaction fee
    const transactionFee = convertedAmount * TRANSACTION_FEE_RATE;
    const finalConvertedAmount = convertedAmount - transactionFee;

    // Check if the user was referred by someone
    const userHasReferral = await Referral.findOne({ referredUser: user._id });
    if (userHasReferral) {
      // The user was referred by someone, calculate and award the referral bonus

      // Calculate referral bonus amount
      const referrer = userHasReferral.referrer;
      const referralBonus = finalConvertedAmount * REFERRAL_BONUS_RATE;

      // Update the wallet balance of the referrer
      const referrerWallet = await Wallet.findOne({ user: referrer });

      if (referrerWallet) {
        referrerWallet.balance += referralBonus;
        await referrerWallet.save();
      }

      // conversion record for the referral bonus
      const referral = new Referral({
        referrer,
        referredUser: user._id,
        bonusAmount: referralBonus,
        convertedAmount,
      });

      await referral.save();
    }

    // Update user's wallet balances
    fromAssetEntry.balance -= amount;
    toAssetEntry.balance += finalConvertedAmount;

    // Create a conversion record for the user's transaction
    const conversion = new Conversion({
      user: user._id,
      fromAsset,
      toAsset,
      amountConverted: amount,
      amountReceived: finalConvertedAmount,
      trxFee: transactionFee,
      status: "completed",
      // Set referral-related fields
      referral: userHasReferral ? userHasReferral._id : null,
    });

    // Save the updated wallet and conversion records
    await Promise.all([userWallet.save(), conversion.save()]);

    // Calculate daily profit and update the Profit schema
    const today = new Date();
    let profit = await Profit.findOne({}).sort({ _id: -1 });

    if (!profit) {
      // Create a new profit record if it doesn't exist
      profit = new Profit({
        totalProfit: 0,
        dailyProfits: [],
        weeklyProfits: [],
        monthlyProfits: [],
        yearlyProf: [],
      });
    }

    if (!profit.dailyProfits.length || profit.dailyProfits[0].date.toDateString() !== today.toDateString()) {
      // Create a new daily profit entry if it's a new day
      const newDailyProfit = {
        date: today,
        amount: transactionFee, // Store the transaction fee as daily profit
      };
      profit.dailyProfits.unshift(newDailyProfit);
    } else {
      // If it's the same day, update the existing daily profit
      profit.dailyProfits[0].amount += transactionFee;
    }

    // Update total daily profit
    profit.totalProfit += transactionFee;

    // Save the updated profit schema
    await profit.save();

    return res.json({ success: true, message: 'Conversion successful' });
  } catch (error) {
    console.error('Error processing conversion:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

module.exports = {
  getTransactionHistory,
  deposit,
  withdrawal,
  convertAssets
};
