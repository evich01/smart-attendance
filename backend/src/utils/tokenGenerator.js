const { v4: uuidv4 } = require('uuid');
const Setting = require('../models/Setting');

function generateSessionToken() {
  return uuidv4();
}

async function getQrExpirySeconds() {
  const setting = await Setting.findOne({ key: 'qrExpirySeconds' });
  if (setting) {
    return parseInt(setting.value, 10) || 30;
  }
  return parseInt(process.env.QR_TOKEN_EXPIRY_SECONDS, 10) || 30;
}

async function computeExpiresAt() {
  const expirySeconds = await getQrExpirySeconds();
  return new Date(Date.now() + expirySeconds * 1000);
}

module.exports = { generateSessionToken, getQrExpirySeconds, computeExpiresAt };
