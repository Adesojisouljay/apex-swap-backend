const fs = require('fs');
const crypto = require('crypto');

const ENCRYPTION_ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef';
const PRIVATE_KEYS_DIR = './secure-keys/';

function encrypt(text) {
    if (!text) {
      return null; 
    }
  
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }
  

function decrypt(text) {
  const [iv, encryptedText] = text.split(':');
  const decipher = crypto.createDecipheriv(
    ENCRYPTION_ALGORITHM,
    Buffer.from(ENCRYPTION_KEY),
    Buffer.from(iv, 'hex')
  );
  let decrypted = decipher.update(Buffer.from(encryptedText, 'hex'));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

function storePrivateKey(userId, privateKey) {
  const encryptedKey = encrypt(privateKey);
  const filePath = PRIVATE_KEYS_DIR + userId + '.txt';

  try {
    fs.writeFileSync(filePath, encryptedKey);
    return true;
  } catch (error) {
    console.error('Error storing private key:', error);
    return false;
  }
}

function getPrivateKey(userId) {
  const filePath = PRIVATE_KEYS_DIR + userId + '.txt';

  if (fs.existsSync(filePath)) {
    try {
      const encryptedKey = fs.readFileSync(filePath, 'utf-8');
      return decrypt(encryptedKey);
    } catch (error) {
      console.error('Error reading private key:', error);
      return null;
    }
  }

  return null;
}

module.exports = {
  encrypt,
  decrypt,
  storePrivateKey,
  getPrivateKey,
};
