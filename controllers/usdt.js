const TronWeb = require('tronweb');
const secureKeyStorage = require('../secure-key-storage');


// Configuring TronWeb with a valid full node URL
const tronWeb = new TronWeb({
  fullHost: 'https://api.trongrid.io', // to be replaced with the actual full node URL
  solidityNode: 'https://api.trongrid.io',
});

// Address of the USDT contract on TRON mainnet
const usdtContractAddress = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'; 

const sendTRX = async (req, res) => {
    const { senderAddress, recipientAddress, trxAmount, userId } = req.body;
  
    try {
      // Retrieve the sender's private key from the secure key storage
      const senderPrivateKey = await secureKeyStorage.getPrivateKey(userId);
  
      // transaction object
      const transaction = await tronWeb.transactionBuilder.sendTrx(
        recipientAddress,
        trxAmount,
        senderAddress // Sender's address
      );
  
      // Sign the transaction with the sender's private key
      const signedTransaction = await tronWeb.trx.sign(transaction, senderPrivateKey);
  
      // Send the signed transaction to the TRON network
      const transactionResponse = await tronWeb.trx.sendRawTransaction(
        signedTransaction
      );
  
      // Update sender's and recipient's wallet balances 
  
      res.json({ success: true, transactionId: transactionResponse.txid });
    } catch (error) {
      console.error('Error sending TRX:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  };

const checkWalletBalance = async (req, res) => {
const { walletAddress } = req.params;
try {
    // Fetch the TRX balance
    const trxBalance = await tronWeb.trx.getBalance(walletAddress);

     // set the owner address
     tronWeb.setAddress('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');

    // Fetch the USDT balance using the TRC20 contract
    const usdtContract = await tronWeb.contract().at(usdtContractAddress);
    const usdtBalance = await usdtContract.balanceOf(walletAddress).call();

    res.json({
    success: true,
    balances: {
        trx: `${tronWeb.fromSun(trxBalance)} TRX`, // Convert from Sun to TRX
        usdt: `${usdtBalance / 1e6} USDT`, // Convert from Sun to USDT
    },
    });
} catch (error) {
    console.error('Error checking balances:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
}
};
  

module.exports = {
  sendTRX,
  checkWalletBalance
};
