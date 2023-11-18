const Transfer = require('../models/transfer');
const User = require('../models/user');
const Wallet = require('../models/wallet');

const transfer = async (req, res) => {
  try {
    const { senderUsername, recipientUsername, asset, amount, memo } = req.body;

    // Find the sender and recipient users by their usernames
    const sender = await User.findOne({ username: senderUsername });
    const recipient = await User.findOne({ username: recipientUsername });

    if (recipientUsername === senderUsername) {
      return res.status(403).json({ success: false, error: 'You can not make a trasfer to yourself' });
    }

    if (req.user.username !== senderUsername) {
      return res.status(403).json({ success: false, error: 'You are not authenticated' });
    }

    if (!sender || !recipient) {
      return res.status(400).json({ success: false, error: 'Sender or recipient not found' });
    }

    // Fetch sender's and recipient's wallets
    const senderWallet = await Wallet.findOne({ user: sender._id });
    const recipientWallet = await Wallet.findOne({ user: recipient._id });

    // Check if the sender has the requested asset and sufficient balance
    const senderAssetEntry = senderWallet?.assets.find((a) => a.type === asset);

    if (!senderAssetEntry || senderAssetEntry.balance < amount) {
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }

    // Deduct the transferred amount from the sender's balance
    senderAssetEntry.balance -= amount;

    // Create a transfer record for sender to recipient
    const transferRecord = new Transfer({
      sender: sender._id,
      recipient: recipient._id,
      asset,
      amount,
      memo,
    });

    // Update the recipient's balance
    const recipientAssetEntry = recipientWallet?.assets.find((a) => a.type === asset);
    if (recipientAssetEntry) {
      recipientAssetEntry.balance += amount;
    } else {
      // If the recipient doesn't have the asset, create a new entry
      recipientWallet.assets.push({
        type: asset,
        address: '', // You can add an address if necessary
        balance: amount,
        userMemo: '',
      });
    }

    // Save the updated wallets and the transfer record
    await Promise.all([senderWallet.save(), recipientWallet.save(), transferRecord.save()]);

    res.json({ success: true, message: 'Transfer processed' });
  } catch (error) {
    console.error('Error processing transfer:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

module.exports = { transfer }
