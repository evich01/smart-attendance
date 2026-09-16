const Setting = require('../models/Setting');

const DEFAULTS = [
  { key: 'workStartTime', value: '08:00', label: 'Official Work Start Time (HH:MM)' },
  { key: 'lateThresholdTime', value: '08:15', label: 'Late Threshold Time (HH:MM)' },
  { key: 'workEndTime', value: '17:00', label: 'Official Work End Time (HH:MM)' },
  { key: 'qrExpirySeconds', value: '30', label: 'QR Token Expiry Duration (seconds)' },
  { key: 'sessionAutoEndSeconds', value: '28800', label: 'Auto-End Session After (seconds)' },
  { key: 'companyName', value: 'My Company', label: 'Company Name' },
  { key: 'timezone', value: 'UTC', label: 'Company Timezone' }
];

async function getSettings(req, res) {
  for (const d of DEFAULTS) {
    await Setting.updateOne({ key: d.key }, { $setOnInsert: { ...d, updatedAt: new Date() } }, { upsert: true });
  }
  const settings = await Setting.find({});
  res.json({ success: true, data: settings });
}

async function updateSettings(req, res) {
  const updates = req.body;
  const allowedKeys = DEFAULTS.map((d) => d.key);

  const results = [];
  for (const [key, value] of Object.entries(updates)) {
    if (!allowedKeys.includes(key)) continue;
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
