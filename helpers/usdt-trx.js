const TronWeb = require('tronweb');
const secureKeyStorage = require('../secure-key-storage');


// Configure TronWeb with a valid full node URL
const tronWeb = new TronWeb({
  fullHost: 'https://api.trongrid.io',
  solidityNode: 'https://api.trongrid.io',
});

const usdtContractAddress = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'; 

const sendUsdt = async (senderPrivateKey, recipientAddress, amount) => {
    try {
      const senderWallet = tronWeb.address.fromPrivateKey(senderPrivateKey);
  
      const senderAddress = senderWallet.address;
      const senderWalletHex = tronWeb.address.toHex(senderAddress);
      const usdtContract = await tronWeb.contract().at(usdtContractAddress);
      const senderBalance = await usdtContract.balanceOf(senderWalletHex).call();
  
      const amountSun = tronWeb.toSun(amount);
  
      if (senderBalance < amountSun) {
        throw new Error('Insufficient USDT balance');
      }
  
      const transferTx = await usdtContract.transfer(recipientAddress, amountSun).send({
        feeLimit: 1e7, 
      }, senderPrivateKey);
  
      return transferTx;
    } catch (error) {
      console.error('Error sending USDT:', error);
      throw error;
    }
  };
  
const checkUSDTBalance = async (walletAddress) => {
try {
    tronWeb.setAddress('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');
    const usdtContract = await tronWeb.contract().at(usdtContractAddress);
    const walletBalance = await usdtContract.balanceOf(walletAddress).call();

    const usdtBalance = tronWeb.fromSun(walletBalance);

    return usdtBalance;
} catch (error) {
    console.error('Error checking USDT balance:', error);
    throw error;
}
}
  