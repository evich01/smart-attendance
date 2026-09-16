const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema({
  type: { type: String, enum: ['CHECK_IN', 'CHECK_OUT'], required: true },
  sessionToken: { type: String, required: true, unique: true },
  sessionDate: { type: Date, required: true },
  startedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  closedAt: { type: Date, default: null },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
