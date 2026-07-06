const { v4: uuidv4 } = require('uuid');

function generateSessionToken() {
  return uuidv4();
}

function getQrExpirySeconds() {
  return parseInt(process.env.QR_TOKEN_EXPIRY_SECONDS, 10) || 30;
}

function computeExpiresAt() {
  return new Date(Date.now() + getQrExpirySeconds() * 1000);
}

module.exports = { generateSessionToken, getQrExpirySeconds, computeExpiresAt };
