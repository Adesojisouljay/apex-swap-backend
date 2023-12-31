const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require('../models/user');

async function authenticateToken(req, res, next) {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.slice(7);

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);

    req.user = user;

    const authUser = await User.findOne({ _id: user.userId });

    if (!authUser) {
      return res.status(403).json({ error: 'Invalid token.' });
    }

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token.' });
  }
}

module.exports = authenticateToken;
