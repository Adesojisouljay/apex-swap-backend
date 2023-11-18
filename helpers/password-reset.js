const bcrypt = require('bcryptjs');
const User = require("../models/user")

const generateResetToken = () => {
  const min = 100000;
  const max = 999999;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const verifyResetToken = async (email, resetToken) => {
  
};

const updateUserPassword = async (email, newPassword) => {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    return true;
  } catch (error) {
    console.error('Error updating password:', error);
    return false;
  }
};

const invalidateResetToken = async (email) => {
  
};

module.exports = { generateResetToken, verifyResetToken, updateUserPassword, invalidateResetToken };
