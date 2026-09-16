const QRCode = require('qrcode');

async function generateQrDataUrl({ sessionId, sessionToken, type }) {
  const payload = JSON.stringify({ sessionId, sessionToken, type });
  const dataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 320
  });
  return dataUrl;
}

module.exports = { generateQrDataUrl };
