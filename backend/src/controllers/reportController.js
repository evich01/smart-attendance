const AttendanceRecord = require('../models/AttendanceRecord');
const AttendanceSession = require('../models/AttendanceSession');
const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const Course = require('../models/Course');
const { buildAttendanceCsv } = require('../utils/csvExporter');

function statusBadge(pct) {
  if (pct >= 75) return 'Good';
  if (pct >= 60) return 'Warning';
  return 'At Risk';
}

// GET /api/reports/course/:courseId — per-student attended/total/percentage
async function courseReport(req, res) {
  const { courseId } = req.params;

  const course = await Course.findById(courseId);
  if (!course) return res.status(404).json({ success: false, error: 'Course not found' });

  const sessions = await AttendanceSession.find({ courseId }).select('_id');
  const sessionIds = sessions.map((s) => s._id);
  const totalSessions = sessionIds.length;

  const enrollments = await Enrollment.find({ courseId }).populate({
    path: 'studentId', populate: { path: 'userId', select: 'name email' }
  });

  const rows = await Promise.all(enrollments.map(async (e) => {
    const attendedCount = await AttendanceRecord.countDocuments({
      sessionId: { $in: sessionIds },
      studentId: e.studentId._id,
      status: { $in: ['present', 'late'] }
    });
    const pct = totalSessions > 0 ? Math.round((attendedCount / totalSessions) * 100) : 0;
    return {
      studentId: e.studentId._id,
      studentName: e.studentId.userId?.name || 'Unknown',
      studentNumber: e.studentId.studentNumber,
      attended: attendedCount,
      total: totalSessions,
      percentage: pct,
      status: statusBadge(pct)
    };
  }));

  res.json({ success: true, data: { course: { code: course.code, name: course.name }, totalSessions, students: rows } });
}

// GET /api/reports/institution — institution-wide analytics
async function institutionReport(req, res) {
  // 14-day daily attendance trend
  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);

  const records = await AttendanceRecord.find({ scannedAt: { $gte: since } }).select('scannedAt status');
  const trendMap = {};
  for (let i = 0; i < 14; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    trendMap[key] = 0;
  }
  records.forEach((r) => {
    const key = r.scannedAt.toISOString().slice(0, 10);
    if (trendMap[key] !== undefined) trendMap[key] += 1;
  });
  const dailyTrend = Object.entries(trendMap).map(([date, count]) => ({ date, count }));

  // Course attendance rate comparison
  const courses = await Course.find({ isActive: true });
  const courseRates = await Promise.all(courses.map(async (c) => {
    const sessions = await AttendanceSession.find({ courseId: c._id }).select('_id');
    const sessionIds = sessions.map((s) => s._id);
    const enrolledCount = await Enrollment.countDocuments({ courseId: c._id });
    const possible = sessionIds.length * enrolledCount;
    const attended = possible > 0
      ? await AttendanceRecord.countDocuments({ sessionId: { $in: sessionIds }, status: { $in: ['present', 'late'] } })
      : 0;
    const rate = possible > 0 ? Math.round((attended / possible) * 100) : 0;
    return { courseCode: c.code, courseName: c.name, rate };
  }));

  // Top 5 courses by attendance rate
  const top5 = [...courseRates].sort((a, b) => b.rate - a.rate).slice(0, 5);

  // 10 most recent sessions
  const recentSessions = await AttendanceSession.find({}).populate('courseId').sort({ createdAt: -1 }).limit(10);
  const recentSessionsData = recentSessions.map((s) => ({
    sessionId: s._id,
    courseCode: s.courseId?.code,
    title: s.title,
    sessionDate: s.sessionDate,
    isActive: s.isActive
  }));

  res.json({
    success: true,
    data: { dailyTrend, courseRates, top5, recentSessions: recentSessionsData }
  });
}

// GET /api/reports/student/history — student's personal attendance history
async function studentHistory(req, res) {
  const student = await Student.findOne({ userId: req.user.id });
  if (!student) return res.status(404).json({ success: false, error: 'Student profile not found' });

  const enrollments = await Enrollment.find({ studentId: student._id }).populate('courseId');

  const history = await Promise.all(enrollments.map(async (e) => {
    const sessions = await AttendanceSession.find({ courseId: e.courseId._id }).select('_id');
    const sessionIds = sessions.map((s) => s._id);
    const attended = await AttendanceRecord.countDocuments({
      sessionId: { $in: sessionIds }, studentId: student._id, status: { $in: ['present', 'late'] }
    });
    const total = sessionIds.length;
    const pct = total > 0 ? Math.round((attended / total) * 100) : 0;
    return {
      courseCode: e.courseId.code,
      courseName: e.courseId.name,
      attended,
      total,
      percentage: pct,
      status: statusBadge(pct)
    };
  }));

  res.json({ success: true, data: history });
}

// GET /api/reports/export/:courseId — CSV export
async function exportCourseCsv(req, res) {
  const { courseId } = req.params;
  const course = await Course.findById(courseId);
  if (!course) return res.status(404).json({ success: false, error: 'Course not found' });

  const sessions = await AttendanceSession.find({ courseId }).select('_id sessionDate');
  const sessionMap = new Map(sessions.map((s) => [String(s._id), s.sessionDate]));

  const records = await AttendanceRecord.find({ sessionId: { $in: [...sessionMap.keys()] } })
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } });

  const rows = records.map((r) => ({
    studentName: r.studentId.userId?.name || '',
    email: r.studentId.userId?.email || '',
    studentId: r.studentId.studentNumber || '',
    courseCode: course.code,
    sessionDate: sessionMap.get(String(r.sessionId)),
    scannedAt: r.scannedAt,
    status: r.status
  }));

  const csv = buildAttendanceCsv(rows);
  res.header('Content-Type', 'text/csv');
  res.attachment(`${course.code}_attendance.csv`);
  res.send(csv);
}

module.exports = { courseReport, institutionReport, studentHistory, exportCourseCsv };
