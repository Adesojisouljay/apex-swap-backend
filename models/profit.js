const mongoose = require('mongoose');

const profitSchema = new mongoose.Schema({
  totalProfit: {
    type: Number,
    default: 0,
  },
  dailyProfits: [
    {
      date: Date,
      amount: Number,
    },
  ],
  weeklyProfits: [
    {
      weekStart: Date,
      weekEnd: Date,
      amount: Number,
    },
  ],
  monthlyProfits: [
    {
      month: Number,
      year: Number,
      amount: Number,
    },
  ],
  yearlyProfits: [
    {
      year: Number,
      amount: Number,
    },
  ],
});

const Profit = mongoose.model('Profit', profitSchema);

module.exports = Profit;
