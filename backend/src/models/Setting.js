const mongoose = require('mongoose');

// NOTE: no gpsEnabled / gpsRadius settings — GPS is fully removed.
// Pre-seeded keys: qrExpirySeconds, lateThresholdMinutes, institutionName, academicYear, currentSemester
const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, default: '' },
  label: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Setting', settingSchema);
