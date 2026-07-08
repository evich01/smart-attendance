const Setting = require('../models/Setting');

const DEFAULTS = [
  { key: 'qrExpirySeconds', value: '30', label: 'QR Token Expiry Duration (seconds)' },
  { key: 'lateThresholdMinutes', value: '15', label: 'Late-Arrival Threshold (minutes)' },
  { key: 'sessionAutoEndSeconds', value: '10800', label: 'Auto-End Session After (seconds)' },
  { key: 'institutionName', value: 'GCTU', label: 'Institution Name' },
  { key: 'academicYear', value: '2025/2026', label: 'Current Academic Year' },
  { key: 'currentSemester', value: 'Semester 1', label: 'Current Semester' }
];
// NOTE: no gpsEnabled / gpsRadius entries — GPS is fully removed per spec.

// GET /api/settings
async function getSettings(req, res) {
  // Ensure defaults exist (idempotent seed-on-read)
  for (const d of DEFAULTS) {
    await Setting.updateOne({ key: d.key }, { $setOnInsert: d }, { upsert: true });
  }
  const settings = await Setting.find({});
  res.json({ success: true, data: settings });
}

// PUT /api/settings
async function updateSettings(req, res) {
  const updates = req.body; // { key: value, ... }
  const allowedKeys = DEFAULTS.map((d) => d.key);

  const results = [];
  for (const [key, value] of Object.entries(updates)) {
    if (!allowedKeys.includes(key)) continue; // silently ignore unknown/disallowed keys (e.g. any gps* key)
    const updated = await Setting.findOneAndUpdate(
      { key },
      { value: String(value), updatedAt: new Date() },
      { new: true, upsert: true }
    );
    results.push(updated);
  }

  res.json({ success: true, data: results });
}

module.exports = { getSettings, updateSettings };
