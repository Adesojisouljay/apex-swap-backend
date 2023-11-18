const { fetchAndStoreCryptoPrices } = require("../helpers/getCryptoPrices");
const CryptoInfo = require('../models/cryptoInfo');
const Wallet = require('../models/wallet');

const getCryptoPrices = async (req, res) => {
  try {
    const cryptoData = await CryptoInfo.find({});

    if (cryptoData.length === 0) {
      await fetchAndStoreCryptoPrices();
      
      const updatedCryptoData = await CryptoInfo.find({});
      
      res.json({ success: true, cryptoData: updatedCryptoData });
    } else {
      res.json({ success: true, cryptoData });
    }
  } catch (error) {
    console.error('Error getting cryptocurrency prices:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

const getCryptoWallet = async (req, res) => {
  const id = req.params.id;
  try {
    const cryptoWallet = await Wallet.findOne({ user: id }).lean();
    const cryptoData = await CryptoInfo.find({});

    if (!cryptoWallet) {
      return res.status(404).json({ msg: "No wallet found" });
    }

    const matchingData = cryptoWallet.assets.map((wallet) => {
      const coinType = wallet.type;
      const data = cryptoData.find((d) => d.symbol === coinType.toLowerCase());

      if (data) {
        return { ...wallet, coinData: data };
      }

      return wallet;
    });
    console.log(matchingData)
    res.json({ success: true, matchingData });
  } catch (error) {
    console.error('Error getting cryptocurrency prices:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};



module.exports = { getCryptoPrices, getCryptoWallet };
