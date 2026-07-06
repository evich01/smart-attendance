const Log = require('../models/Log');

// Audit log records action type and IP address only — no sensitive payloads.
async function logAction({ userId = null, action, details = '', req = null }) {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '') : '';
    await Log.create({ userId, action, details, ipAddress });
  } catch (err) {
    console.error('[logger] failed to write audit log:', err.message);
  }
}

module.exports = { logAction };
