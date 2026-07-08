const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const Enrollment = require('../models/Enrollment');
const Lecturer = require('../models/Lecturer');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Setting = require('../models/Setting');
const { generateQrDataUrl } = require('../utils/qrGenerator');
const { generateSessionToken, computeExpiresAt, getQrExpirySeconds } = require('../utils/tokenGenerator');

async function endExpiredSessions() {
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
  await AttendanceSession.updateMany(
    { isActive: true, sessionDate: { $lt: threeHoursAgo } },
    { isActive: false }
  );
}

async function getLateThresholdMinutes() {
  const setting = await Setting.findOne({ key: 'lateThresholdMinutes' });
  if (setting) {
    return parseInt(setting.value, 10) || 15;
  }
  return parseInt(process.env.LATE_THRESHOLD_MINUTES, 10) || 15;
}

// POST /api/attendance/session — Lecturer creates a session + first QR token.
// NOTE: request body is only { courseId, title } — no location/GPS fields accepted or read.
async function createSession(req, res) {
  await endExpiredSessions();
  const { courseId, title } = req.body;
  if (!courseId) return res.status(400).json({ success: false, error: 'courseId is required' });

  const lecturer = await Lecturer.findOne({ userId: req.user.id });
  if (!lecturer) return res.status(404).json({ success: false, error: 'Lecturer profile not found' });

  const course = await Course.findOne({ _id: courseId, lecturerId: lecturer._id });
  if (!course) return res.status(403).json({ success: false, error: 'You are not assigned to this course' });

  const token = generateSessionToken();
  const expiresAt = await computeExpiresAt();
  const qrExpirySeconds = await getQrExpirySeconds();

  const session = await AttendanceSession.create({
    courseId: course._id,
    lecturerId: lecturer._id,
    title: title || `${course.code} Session`,
    token,
    expiresAt,
    sessionDate: new Date(),
    isActive: true
  });

  const qrDataUrl = await generateQrDataUrl({ sessionId: session._id, token, courseCode: course.code });

  res.status(201).json({
    success: true,
    data: {
      sessionId: session._id,
      title: session.title,
      qrDataUrl,
      expiresAt: session.expiresAt,
      qrExpirySeconds
    }
  });
}

// GET /api/attendance/session/:id/qr — current QR + countdown state.
// Auto-refreshes (rotates) the token if the previous one has expired.
async function getSessionQr(req, res) {
  await endExpiredSessions();
  const session = await AttendanceSession.findById(req.params.id).populate('courseId');
  if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
  if (!session.isActive) return res.status(400).json({ success: false, error: 'Session has ended' });

  const now = new Date();
  if (now > session.expiresAt) {
    session.token = generateSessionToken();
    session.expiresAt = await computeExpiresAt();
    await session.save();
  }

  const qrDataUrl = await generateQrDataUrl({
    sessionId: session._id,
    token: session.token,
    courseCode: session.courseId.code
  });

  const qrExpirySeconds = await getQrExpirySeconds();

  res.json({
    success: true,
    data: {
      sessionId: session._id,
      qrDataUrl,
      expiresAt: session.expiresAt,
      qrExpirySeconds,
      serverTime: now
    }
  });
}

// PATCH /api/attendance/session/:id/end
async function endSession(req, res) {
  const session = await AttendanceSession.findById(req.params.id);
  if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

  session.isActive = false;
  await session.save();

  res.json({ success: true, data: { sessionId: session._id, isActive: false } });
}

// GET /api/attendance/session/:id/live — live attendance list (polled every 5s)
async function liveAttendance(req, res) {
  await endExpiredSessions();
  const records = await AttendanceRecord.find({ sessionId: req.params.id })
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } })
    .sort({ scannedAt: -1 });

  res.json({
    success: true,
    data: records.map((r) => ({
      id: r._id,
      studentName: r.studentId?.userId?.name || 'Unknown',
      studentNumber: r.studentId?.studentNumber || '',
      status: r.status,
      scannedAt: r.scannedAt
    }))
  });
}

// POST /api/attendance/scan — Student submits a scanned token.
// Sequential validation exactly per FR-06 (five steps — no GPS/location branch).
async function scanAttendance(req, res) {
  await endExpiredSessions();
  const { sessionId, token } = req.body;
  if (!sessionId || !token) {
    return res.status(400).json({ success: false, error: 'sessionId and token are required' });
  }

  // Step 1: JWT identity already validated by the `auth` middleware before reaching here.
  const student = await Student.findOne({ userId: req.user.id });
  if (!student) return res.status(403).json({ success: false, error: 'Student profile not found' });

  // Step 2: Match submitted token against the stored session token.
  const session = await AttendanceSession.findById(sessionId);
  if (!session || session.token !== token) {
    return res.status(400).json({ success: false, error: 'Invalid QR Code' });
  }
  if (!session.isActive) {
    return res.status(400).json({ success: false, error: 'This session has ended' });
  }

  // Step 3: Reject if token has expired.
  if (new Date() > session.expiresAt) {
    return res.status(400).json({ success: false, error: 'QR Expired — please scan the latest code' });
  }

  // Step 4: Verify the student is enrolled in the course tied to the session.
  const enrollment = await Enrollment.findOne({ studentId: student._id, courseId: session.courseId });
  if (!enrollment) {
    return res.status(403).json({ success: false, error: 'Not Enrolled in this course' });
  }

  // Step 5: Enforce unique (sessionId, studentId) — prevent duplicate check-ins.
  const existing = await AttendanceRecord.findOne({ sessionId: session._id, studentId: student._id });
  if (existing) {
    return res.status(409).json({ success: false, error: 'Duplicate: attendance already recorded for this session' });
  }

  // Assign status based on elapsed time since session start.
  const lateThresholdMinutes = await getLateThresholdMinutes();
  const lateThresholdMs = lateThresholdMinutes * 60 * 1000;
  const elapsed = Date.now() - new Date(session.sessionDate).getTime();
  const status = elapsed <= lateThresholdMs ? 'present' : 'late';

  const record = await AttendanceRecord.create({
    sessionId: session._id,
    studentId: student._id,
    scannedAt: new Date(),
    status
  });

  res.status(200).json({
    success: true,
    data: { recordId: record._id, status: record.status, scannedAt: record.scannedAt }
  });
}

module.exports = { createSession, getSessionQr, endSession, liveAttendance, scanAttendance };
