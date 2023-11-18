const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Wallet = require('../models/wallet');
const { createTronAddress, generateUserMemo } = require("../generate.js")
const { JWT_SECRET } = process.env;
const {storePrivateKey, encrypt} = require('../secure-key-storage');
const { generateResetToken } = require('../helpers/password-reset');
const { generateReferralCode } = require('../helpers/referral-link');
const mongoose = require("mongoose")


const registerUser = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists.' });
    }

    const referralCode = generateReferralCode()
    
    // Generate a TRC20 address and private key for the user
    const { address, privateKey } = await createTronAddress();

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a unique memo for deposits
    const memo = await generateUserMemo();

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      userMemo: memo,
      referralCode
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
          privateKey: encrypt(privateKey)
        },
      ],
    });

    await newWallet.save();

    storePrivateKey(newUser._id, privateKey);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24hr' });

    res.status(200).json({ token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...userData } = user.toObject();

    res.json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    const { username, email, profilePicture, firstName, lastName } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.username = username || user.username; 
    user.email = email || user.email;
    user.profilePicture = profilePicture || user.profilePicture;
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;

    await user.save();

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

const sendPasswordResetToken = async (req, res) => {
  try {
    const { email } = req.body;

    // Generate a 6-digit numeric password reset token
    const resetToken = generateResetToken();

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.resetToken = resetToken;
    user.tokenExpiration = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();      

    res.json({ success: true, message: 'Password reset email sent successfully', rtoken: resetToken,exp: new Date(Date.now() + 15 * 60 * 1000) });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, rtoken, newPassword } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.resetToken || !user.tokenExpiration) {
      return res.status(400).json({ success: false, error: 'Reset rtoken not found' });
    }

    const isTokenValid = user.tokenExpiration > new Date() && user.resetToken === rtoken;
                      
    if (!isTokenValid) {
      // If the token is invalid or expired, mark as null and save the user document
      user.resetToken = null;
      user.tokenExpiration = null;
      await user.save();

      return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
    }

    // Generate a new password for the user
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the user's password and clear the reset token
    user.password = hashedPassword;
    user.resetToken = null;
    user.tokenExpiration = null;

    // Save the updated user document
    await user.save();

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};



module.exports = { registerUser, loginUser, updateUserProfile, sendPasswordResetToken, resetPassword, getUserProfile };
