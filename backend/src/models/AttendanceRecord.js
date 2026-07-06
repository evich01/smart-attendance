const mongoose = require('mongoose');

// NOTE: No lat / lng fields — GPS is fully removed per the build spec.
const attendanceRecordSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceSession', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  scannedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['present', 'late', 'absent'], required: true }
});

// Prevents duplicate check-in for the same session by the same student
attendanceRecordSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
