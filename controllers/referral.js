const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Referral = require('../models/referral');
const Wallet = require('../models/wallet');
const { createTronAddress, generateUserMemo } = require('../generate.js');
const {storePrivateKey, encrypt} = require('../secure-key-storage');
const { generateReferralCode } = require('../helpers/referral-link');
const mongoose = require('mongoose');


const registerUserWithReferral = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists.' });
    }

    const referralCode = req.query.ref;  
    const referringUser = await User.findOne({ referralCode });

    console.log("referringUser", referringUser)

    const { address, privateKey } = await createTronAddress();
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const memo = await generateUserMemo();

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      userMemo: memo,
      referralCode: generateReferralCode(),
    });

    await newUser.save();

    const newWallet = new Wallet({
      user: newUser._id,
      assets: [
        {
          type: 'Hive',
          address: 'apex-swap',
          balance: 0,
          userMemo: memo,
        },
        {
          type: 'HBD',
          address: 'apex-swap',
          balance: 0,
          userMemo: memo,
        },
        {
          type: 'USDT',
          address: address.base58,
          balance: 0,
          userMemo: memo,
          privateKey: encrypt(privateKey),
        },
      ],
    });

    await newWallet.save();
    
    const newReferral = new Referral({
      referrer: referringUser._id,
      referredUser: newUser._id,
    });

    await newReferral.save()

    storePrivateKey(newUser._id, privateKey);

    res.status(201).json({ message: 'User registered successfully with referral' });
  } catch (error) {
    console.error('Error registering user with referral:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getReferredUsers = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const referrals = await Referral.find({ referrer: userId });

    if (referrals.length === 0) {
      return res.json({ referredUsernames: [] });
    }

    const referredUserIds = referrals.map((referral) => referral.referredUser);

    const referredUsers = await User.find({ _id: { $in: referredUserIds } });

    const referredUsernames = referredUsers.map((user) => user.username);

    res.json({ referredUsernames });
  } catch (error) {
    console.error('Error getting referred users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  registerUserWithReferral,
  getReferredUsers
};
