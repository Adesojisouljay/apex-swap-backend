const shortid = require("shortid");

const generateReferralCode = () => {
  const referralCode = shortid.generate();

  return referralCode;
};

module.exports = { generateReferralCode };
