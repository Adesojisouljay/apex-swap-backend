const express = require("express");
const { registerUser, loginUser, updateUserProfile, sendPasswordResetToken, resetPassword, getUserProfile } = require("../controllers/users.js")
const { sendTRX, checkWalletBalance } = require("../controllers/usdt.js")
const { getTransactionHistory,deposit, withdrawal, convertAssets } = require("../controllers/transactions.js")
const { transfer } = require("../controllers/transfers.js")
const { userNotification, markNotificationAsRead } = require("../controllers/notifications.js")
const { getCryptoPrices, getCryptoWallet } = require("../controllers/crypto.js")
const { registerUserWithReferral, getReferredUsers } = require("../controllers/referral.js")
const authenticateToken = require("../middleware/authenticateToken");

const router = express.Router();

//Users
router.post('/register', (req, res) => {
    const { ref } = req.query;
  
    if (ref) {
      // Registration with referral code
      return registerUserWithReferral(req, res, ref);
    } else {
      // Regular user registration
      return registerUser(req, res);
    }
  });
  

router.post('/login', loginUser);
router.post('/profile/:id', authenticateToken, updateUserProfile);
router.post('/reset-password', authenticateToken, sendPasswordResetToken);
router.post('/confirm-password', authenticateToken, resetPassword);

//get
router.get('/profile/:id', getUserProfile);
//trx7
router.post('/send-trx', sendTRX);
router.get('/balance/:walletAddress', checkWalletBalance);

//transactions
router.post('/transaction/deposit', authenticateToken, deposit);
router.post('/transaction/withdraw', authenticateToken, withdrawal);
router.post('/transaction/convert', authenticateToken, convertAssets);
router.get('/transaction/:username', authenticateToken, getTransactionHistory);

//transfer
router.post('/transfer', authenticateToken, transfer);

//notifications
router.post('/notification', userNotification);
router.patch('/notifications/mark/:id', markNotificationAsRead);

//Get crypto prices
router.get('/crypto-prices', getCryptoPrices);
router.get('/wallet/:id', getCryptoWallet);

//referrals
router.get('/referrals/:id', getReferredUsers);

module.exports = router;