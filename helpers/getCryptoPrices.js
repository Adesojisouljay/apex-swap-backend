const axios = require('axios');
const CryptoInfo = require('../models/cryptoInfo');


const API_URL = 'https://api.coingecko.com/api/v3';

async function fetchAndStoreCryptoPrices() {
  try {
    const response = await axios.get(`${API_URL}/coins/markets?vs_currency=usd&ids=hive%2C%20hive_dollar%2C%20tether&order=market_cap_desc&per_page=100&page=1&sparkline=false`);
    console.log(response.data);

    const cryptoData = response.data.map(info => ({
      coinId: info.id,
      symbol: info.symbol,
      usdPrice: info.current_price,
      priceChange: info.price_change_24h,
      percentageChange: info.price_change_percentage_24h,
      image: info.image,
    }));

    await CryptoInfo.insertMany(cryptoData);

    return response.data;
  } catch (error) {
    console.error('Error fetching market data:', error);
    throw error;
  }
}


module.exports = { fetchAndStoreCryptoPrices }