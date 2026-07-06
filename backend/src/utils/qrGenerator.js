const QRCode = require('qrcode');

/**
 * Generates a QR code as a Base64 PNG data URL encoding the session token payload.
 * Payload intentionally contains ONLY sessionId, token, and courseCode — no location data.
 */
async function generateQrDataUrl({ sessionId, token, courseCode }) {
  const payload = JSON.stringify({ sessionId, token, courseCode });
  const dataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 320
  });
  return dataUrl;
}

module.exports = { generateQrDataUrl };
