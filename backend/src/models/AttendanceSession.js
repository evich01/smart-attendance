const mongoose = require('mongoose');

// NOTE: No locationLat / locationLng / locationRadius fields — GPS is fully removed
// per the build spec's explicit exclusions (Section 17).
const attendanceSessionSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  lecturerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lecturer', required: true },
  title: { type: String, default: '' },
  token: { type: String, required: true, unique: true }, // rotating UUID
  expiresAt: { type: Date, required: true }, // now + 30s
  sessionDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
