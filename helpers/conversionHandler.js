const { Conversion } = require('../models/transaction');
const Wallet = require('../models/wallet');
const Profit = require('../models/profit');
const User = require('../models/user');
const Referral = require('../models/referral');

// Conversion rates
const HIVE_TO_USDT_RATE = 0.225;
const HBD_TO_USDT_RATE = 0.98;
const TRANSACTION_FEE_RATE = 0.02;
const REFERRAL_BONUS_RATE = 0.002;

async function handleConversion(username, fromAsset, toAsset, amount) {
  try {
    const user = await User.findOne({ username });

    if (!user) {
      throw new Error('User not found');
    };
    
    const userWallet = await Wallet.findOne({ user });

    const fromAssetEntry = userWallet.assets.find((a) => a.type === fromAsset);
    const toAssetEntry = userWallet.assets.find((a) => a.type === toAsset);

    if (!fromAssetEntry || !toAsset || !amount) {
      console.log("some parameters missing")
    }

    if (fromAssetEntry.balance < amount) {
      console.log("Insufficient balance for conversion")
      return 'Insufficient balance for conversion';
    }

    let conversionRate;
    if (fromAsset === 'Hive' && toAsset === 'USDT') {
      conversionRate = HIVE_TO_USDT_RATE;
    } else if (fromAsset === 'HBD' && toAsset === 'USDT') {
      conversionRate = HBD_TO_USDT_RATE;
    } else if (fromAsset === 'USDT' && toAsset === 'Hive') {
      conversionRate = 1 / HIVE_TO_USDT_RATE;
    } else if (fromAsset === 'USDT' && toAsset === 'HBD') {
      conversionRate = 1 / HBD_TO_USDT_RATE;
    } else {
      return 'Invalid conversion pair';
    }

    const convertedAmount = amount * conversionRate;

    // Apply the transaction fee
    const transactionFee = convertedAmount * TRANSACTION_FEE_RATE;
    const finalConvertedAmount = convertedAmount - transactionFee;

    // Check if the user was referred by someone
    const userHasReferral = await Referral.findOne({ referredUser: user._id });
    if (userHasReferral) {
      // The user was referred by someone, calculate and award the referral bonus
      const referrer = userHasReferral.referrer;
      const referralBonus = finalConvertedAmount * REFERRAL_BONUS_RATE;

      // Update the wallet balance of the referrer
      const referrerWallet = await Wallet.findOne({ user: referrer });

      if (referrerWallet) {
        referrerWallet.balance += referralBonus;
        await referrerWallet.save();
      }

      // Conversion record for the referral bonus
      const referral = new Referral({
        referrer,
        referredUser: user._id,
        bonusAmount: referralBonus,
        convertedAmount,
      });

      await referral.save();
    }

    fromAssetEntry.balance -= amount;
    toAssetEntry.balance += finalConvertedAmount;

    // Conversion record for the user's transaction
    const conversion = new Conversion({
      user: user._id,
      fromAsset,
      toAsset,
      amountConverted: amount,
      amountReceived: finalConvertedAmount,
      trxFee: transactionFee,
      status: "completed",
      referral: userHasReferral ? userHasReferral._id : null,
    });

    // Save the updated wallet and conversion records
    await Promise.all([userWallet.save(), conversion.save()]);

    // Calculate daily profit and update the Profit schema
    const today = new Date();
    let profit = await Profit.findOne({}).sort({ _id: -1 });

    if (!profit) {
      // New profit record if it doesn't exist
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

    await profit.save();

    return 'Conversion successful';
  } catch (error) {
    throw error;
  }
}

module.exports = { handleConversion };
