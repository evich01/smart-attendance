const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  checkInTime: { type: Date, default: null },
  checkOutTime: { type: Date, default: null },
  status: { type: String, enum: ['present', 'late', 'absent', 'missing_checkout', 'not_checked_in'], default: 'not_checked_in' },
  workingDuration: { type: Number, default: 0 },
  checkInSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceSession', default: null },
  checkOutSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceSession', default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

attendanceRecordSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
