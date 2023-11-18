const User = require('./models/user');
const TronWeb = require('tronweb');

const tronWeb = new TronWeb({
  fullHost: 'https://api.trongrid.io',
});

const createTronAddress = async () => {
  const account = await tronWeb.createAccount();
  return account;
};


async function generateUserMemo() {
  let memo;
  let isUnique = false;

  // Generate a unique memo
  while (!isUnique) {
    // Generate a 10-digit random number
    memo = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    const existingUser = await User.findOne({ memo });
    
    if (!existingUser) {
      isUnique = true;
    }
  }

  return memo;
};

module.exports = { createTronAddress, generateUserMemo }