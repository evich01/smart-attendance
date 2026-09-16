const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const User = require('../models/User');
const Department = require('../models/Department');
const Setting = require('../models/Setting');
const Leave = require('../models/Leave');
const { generateQrDataUrl } = require('../utils/qrGenerator');
const { generateSessionToken, computeExpiresAt, getQrExpirySeconds } = require('../utils/tokenGenerator');
const { logAction } = require('../utils/logger');

function startOfDay(d) {
  const date = d ? new Date(d) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(d) {
  const date = d ? new Date(d) : new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}

function parseTimeStr(str) {
  const [h, m] = (str || '08:00').split(':').map(Number);
  return { hours: h || 0, minutes: m || 0 };
}

async function getAttendanceSettings() {
  const defaults = [
    { key: 'workStartTime', value: '08:00', label: 'Official Work Start Time (HH:MM)' },
    { key: 'lateThresholdTime', value: '08:15', label: 'Late Threshold Time (HH:MM)' },
    { key: 'workEndTime', value: '17:00', label: 'Official Work End Time (HH:MM)' },
    { key: 'qrExpirySeconds', value: '30', label: 'QR Token Expiry (seconds)' },
    { key: 'sessionAutoEndSeconds', value: '28800', label: 'Auto-End Session After (seconds)' },
    { key: 'companyName', value: 'My Company', label: 'Company Name' },
    { key: 'timezone', value: 'UTC', label: 'Company Timezone' }
  ];
  for (const d of defaults) {
    await Setting.updateOne({ key: d.key }, { $setOnInsert: { ...d, updatedAt: new Date() } }, { upsert: true });
  }
  const settings = await Setting.find({});
  const map = {};
  settings.forEach((s) => (map[s.key] = s.value));
  return map;
}

async function endExpiredSessions() {
  const settings = await getAttendanceSettings();
  const seconds = parseInt(settings.sessionAutoEndSeconds, 10) || 28800;
  const cutoff = new Date(Date.now() - seconds * 1000);
  await AttendanceSession.updateMany(
    { status: 'active', startTime: { $lt: cutoff } },
    { status: 'closed', closedAt: new Date() }
  );
}

async function getManagerDepartmentScope(userId) {
  const user = await User.findById(userId);
  if (!user) return null;
  if (user.role === 'admin') return { all: true };
  if (user.role === 'manager') {
    const depts = await Department.find({ managerId: userId }).select('_id');
    return { all: false, departmentIds: depts.map((d) => d._id) };
  }
  return null;
}

async function startCheckInSession(req, res) {
  await endExpiredSessions();
  const scope = await getManagerDepartmentScope(req.user.id);
  if (!scope) return res.status(403).json({ success: false, error: 'Unauthorized' });

  const today = startOfDay();
  const existingActive = await AttendanceSession.findOne({
    type: 'CHECK_IN',
    sessionDate: { $gte: today, $lte: endOfDay() },
    status: 'active'
  });
  if (existingActive) {
    return res.status(400).json({ success: false, error: 'A Check-In session is already active today' });
  }

  let departmentId = req.body.departmentId || null;
  if (!scope.all && departmentId) {
    const allowed = scope.departmentIds.some((id) => String(id) === String(departmentId));
    if (!allowed) return res.status(403).json({ success: false, error: 'Not authorized for this department' });
  }
  if (!scope.all && scope.departmentIds.length === 1 && !departmentId) {
    departmentId = scope.departmentIds[0];
  }

  const sessionToken = generateSessionToken();
  const expiresAt = await computeExpiresAt();

  const session = await AttendanceSession.create({
    type: 'CHECK_IN',
    sessionToken,
    sessionDate: today,
    startedBy: req.user.id,
    startTime: new Date(),
    expiresAt,
    status: 'active',
    departmentId
  });

  const qrDataUrl = await generateQrDataUrl({ sessionId: session._id, sessionToken, type: 'CHECK_IN' });
  const qrExpirySeconds = await getQrExpirySeconds();

  await logAction({ userId: req.user.id, action: 'START_CHECK_IN_SESSION', details: `sessionId=${session._id}`, req });

  res.status(201).json({
    success: true,
    data: {
      sessionId: session._id,
      type: session.type,
      qrDataUrl,
      expiresAt: session.expiresAt,
      qrExpirySeconds,
      status: session.status
    }
  });
}

async function startCheckOutSession(req, res) {
  await endExpiredSessions();
  const scope = await getManagerDepartmentScope(req.user.id);
  if (!scope) return res.status(403).json({ success: false, error: 'Unauthorized' });

  const today = startOfDay();
  const existingActive = await AttendanceSession.findOne({
    type: 'CHECK_OUT',
    sessionDate: { $gte: today, $lte: endOfDay() },
    status: 'active'
  });
  if (existingActive) {
    return res.status(400).json({ success: false, error: 'A Check-Out session is already active today' });
  }

  let departmentId = req.body.departmentId || null;
  if (!scope.all && departmentId) {
    const allowed = scope.departmentIds.some((id) => String(id) === String(departmentId));
    if (!allowed) return res.status(403).json({ success: false, error: 'Not authorized for this department' });
  }
  if (!scope.all && scope.departmentIds.length === 1 && !departmentId) {
    departmentId = scope.departmentIds[0];
  }

  const sessionToken = generateSessionToken();
  const expiresAt = await computeExpiresAt();

  const session = await AttendanceSession.create({
    type: 'CHECK_OUT',
    sessionToken,
    sessionDate: today,
    startedBy: req.user.id,
    startTime: new Date(),
    expiresAt,
    status: 'active',
    departmentId
  });

  const qrDataUrl = await generateQrDataUrl({ sessionId: session._id, sessionToken, type: 'CHECK_OUT' });
  const qrExpirySeconds = await getQrExpirySeconds();

  await logAction({ userId: req.user.id, action: 'START_CHECK_OUT_SESSION', details: `sessionId=${session._id}`, req });

  res.status(201).json({
    success: true,
    data: {
      sessionId: session._id,
      type: session.type,
      qrDataUrl,
      expiresAt: session.expiresAt,
      qrExpirySeconds,
      status: session.status
    }
  });
}

async function closeSession(req, res) {
  await endExpiredSessions();
  const { id } = req.params;
  const session = await AttendanceSession.findById(id);
  if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

  const scope = await getManagerDepartmentScope(req.user.id);
  if (!scope) return res.status(403).json({ success: false, error: 'Unauthorized' });
  if (!scope.all) {
    if (session.departmentId) {
      const allowed = scope.departmentIds.some((did) => String(did) === String(session.departmentId));
      if (!allowed) return res.status(403).json({ success: false, error: 'Not authorized for this session' });
    } else if (String(session.startedBy) !== String(req.user.id)) {
      return res.status(403).json({ success: false, error: 'Not authorized for this session' });
    }
  }

  session.status = 'closed';
  session.closedAt = new Date();
  await session.save();

  const action = session.type === 'CHECK_IN' ? 'CLOSE_CHECK_IN_SESSION' : 'CLOSE_CHECK_OUT_SESSION';
  await logAction({ userId: req.user.id, action, details: `sessionId=${session._id}`, req });

  res.json({ success: true, data: { sessionId: session._id, status: session.status } });
}

async function getSessionQr(req, res) {
  await endExpiredSessions();
  const session = await AttendanceSession.findById(req.params.id);
  if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
  if (session.status !== 'active') return res.status(400).json({ success: false, error: 'Session is no longer active' });

  const now = new Date();
  if (now > session.expiresAt) {
    session.sessionToken = generateSessionToken();
    session.expiresAt = await computeExpiresAt();
    await session.save();
  }

  const qrDataUrl = await generateQrDataUrl({
    sessionId: session._id,
    sessionToken: session.sessionToken,
    type: session.type
  });
  const qrExpirySeconds = await getQrExpirySeconds();

  res.json({
    success: true,
    data: {
      sessionId: session._id,
      type: session.type,
      qrDataUrl,
      expiresAt: session.expiresAt,
      qrExpirySeconds,
      serverTime: now,
      status: session.status
    }
  });
}

async function getTodaySessions(req, res) {
  await endExpiredSessions();
  const today = startOfDay();
  const sessions = await AttendanceSession.find({
    sessionDate: { $gte: today, $lte: endOfDay() }
  }).sort({ startTime: -1 });

  res.json({
    success: true,
    data: sessions.map((s) => ({
      sessionId: s._id,
      type: s.type,
      status: s.status,
      startTime: s.startTime,
      closedAt: s.closedAt,
      departmentId: s.departmentId
    }))
  });
}

async function checkIn(req, res) {
  await endExpiredSessions();
  const { sessionId, sessionToken } = req.body;
  if (!sessionId || !sessionToken) {
    return res.status(400).json({ success: false, error: 'sessionId and sessionToken are required' });
  }

  const session = await AttendanceSession.findById(sessionId);
  if (!session || session.sessionToken !== sessionToken) {
    return res.status(400).json({ success: false, error: 'Invalid attendance QR code' });
  }
  if (session.status !== 'active') {
    return res.status(400).json({ success: false, error: 'This attendance session is no longer active' });
  }
  if (session.type !== 'CHECK_IN') {
    return res.status(400).json({ success: false, error: 'This is not a Check-In QR code' });
  }
  const today = startOfDay();
  const sessionDay = startOfDay(session.sessionDate);
  if (sessionDay.getTime() !== today.getTime()) {
    return res.status(400).json({ success: false, error: 'Session does not belong to the correct date' });
  }
  if (new Date() > session.expiresAt) {
    return res.status(400).json({ success: false, error: 'QR Expired — please scan the latest code' });
  }

  const todayStart = startOfDay();
  const todayEnd = endOfDay();
  const existing = await AttendanceRecord.findOne({
    employeeId: req.user.id,
    date: { $gte: todayStart, $lte: todayEnd }
  });
  if (existing && existing.checkInTime) {
    return res.status(409).json({ success: false, error: 'You have already checked in today' });
  }

  const settings = await getAttendanceSettings();
  const now = new Date();
  const { hours: lateH, minutes: lateM } = parseTimeStr(settings.lateThresholdTime || '08:15');
  const lateCutoff = new Date(now);
  lateCutoff.setHours(lateH, lateM, 0, 0);

  const status = now <= lateCutoff ? 'present' : 'late';

  let record = existing;
  if (!record) {
    record = await AttendanceRecord.create({
      employeeId: req.user.id,
      date: todayStart,
      checkInTime: now,
      status,
      checkInSessionId: session._id,
      updatedAt: now
    });
  } else {
    record.checkInTime = now;
    record.status = status;
    record.checkInSessionId = session._id;
    record.updatedAt = now;
    await record.save();
  }

  await logAction({ userId: req.user.id, action: 'EMPLOYEE_CHECK_IN', details: `recordId=${record._id}, status=${status}`, req });

  res.json({
    success: true,
    data: {
      recordId: record._id,
      checkInTime: record.checkInTime,
      status,
      message: status === 'present' ? 'Checked in — Present' : 'Checked in — Late'
    }
  });
}

async function checkOut(req, res) {
  await endExpiredSessions();
  const { sessionId, sessionToken } = req.body;
  if (!sessionId || !sessionToken) {
    return res.status(400).json({ success: false, error: 'sessionId and sessionToken are required' });
  }

  const session = await AttendanceSession.findById(sessionId);
  if (!session || session.sessionToken !== sessionToken) {
    return res.status(400).json({ success: false, error: 'Invalid attendance QR code' });
  }
  if (session.status !== 'active') {
    return res.status(400).json({ success: false, error: 'This attendance session is no longer active' });
  }
  if (session.type !== 'CHECK_OUT') {
    return res.status(400).json({ success: false, error: 'This is not a Check-Out QR code' });
  }
  const today = startOfDay();
  const sessionDay = startOfDay(session.sessionDate);
  if (sessionDay.getTime() !== today.getTime()) {
    return res.status(400).json({ success: false, error: 'Session does not belong to the correct date' });
  }
  if (new Date() > session.expiresAt) {
    return res.status(400).json({ success: false, error: 'QR Expired — please scan the latest code' });
  }

  const todayStart = startOfDay();
  const todayEnd = endOfDay();
  const record = await AttendanceRecord.findOne({
    employeeId: req.user.id,
    date: { $gte: todayStart, $lte: todayEnd }
  });
  if (!record || !record.checkInTime) {
    return res.status(400).json({ success: false, error: 'You must check in before checking out' });
  }
  if (record.checkOutTime) {
    return res.status(409).json({ success: false, error: 'Your check-out has already been recorded' });
  }

  const now = new Date();
  record.checkOutTime = now;
  record.checkOutSessionId = session._id;
  record.updatedAt = now;

  const durationMs = now.getTime() - new Date(record.checkInTime).getTime();
  record.workingDuration = Math.max(0, Math.round(durationMs / 60000));
  if (record.status === 'present' || record.status === 'late') {
    record.status = record.status;
  }

  await record.save();

  await logAction({ userId: req.user.id, action: 'EMPLOYEE_CHECK_OUT', details: `recordId=${record._id}, duration=${record.workingDuration}m`, req });

  res.json({
    success: true,
    data: {
      recordId: record._id,
      checkOutTime: record.checkOutTime,
      workingDuration: record.workingDuration,
      message: `Check-out recorded. Working duration: ${Math.floor(record.workingDuration / 60)}h ${record.workingDuration % 60}m`
    }
  });
}

function applyScopeToUserQuery(scope) {
  if (!scope) return { _id: null };
  if (scope.all) return {};
  return { departmentId: { $in: scope.departmentIds } };
}

async function getTodayAttendance(req, res) {
  await endExpiredSessions();
  const scope = await getManagerDepartmentScope(req.user.id);
  if (!scope) return res.status(403).json({ success: false, error: 'Unauthorized' });

  const userQuery = applyScopeToUserQuery(scope);
  userQuery.role = 'staff';
  userQuery.isActive = true;

  const staffList = await User.find(userQuery).select('_id name email employeeId departmentId').populate('departmentId', 'name');
  const todayStart = startOfDay();
  const todayEnd = endOfDay();

  const records = await AttendanceRecord.find({
    employeeId: { $in: staffList.map((s) => s._id) },
    date: { $gte: todayStart, $lte: todayEnd }
  });

  const recordMap = new Map();
  records.forEach((r) => recordMap.set(String(r.employeeId), r));

  const staffRecords = staffList.map((s) => {
    const r = recordMap.get(String(s._id));
    let status = 'not_checked_in';
    if (r) {
      if (r.checkOutTime) status = r.status;
      else if (r.checkInTime) status = 'missing_checkout';
      else status = 'not_checked_in';
    }
    return {
      employeeId: s._id,
      employeeName: s.name,
      email: s.email,
      employeeCode: s.employeeId || '',
      department: s.departmentId?.name || '',
      departmentId: s.departmentId?._id || null,
      checkInTime: r?.checkInTime || null,
      checkOutTime: r?.checkOutTime || null,
      status: r?.status || status,
      displayStatus: status,
      workingDuration: r?.workingDuration || 0
    };
  });

  const totalStaff = staffList.length;
  let present = 0, late = 0, notCheckedIn = 0, missingCheckout = 0, checkedOut = 0, absent = 0;
  staffRecords.forEach((s) => {
    if (s.displayStatus === 'present') { present++; checkedOut++; }
    else if (s.displayStatus === 'late') { late++; checkedOut++; }
    else if (s.displayStatus === 'missing_checkout') {
      missingCheckout++;
      if (s.status === 'present') present++;
      else if (s.status === 'late') late++;
    }
    else if (s.displayStatus === 'not_checked_in') notCheckedIn++;
  });

  res.json({
    success: true,
    data: {
      date: todayStart,
      totalStaff,
      present,
      late,
      notCheckedIn,
      missingCheckout,
      checkedOut,
      absent,
      records: staffRecords
    }
  });
}

async function getMyAttendanceToday(req, res) {
  const todayStart = startOfDay();
  const todayEnd = endOfDay();
  const record = await AttendanceRecord.findOne({
    employeeId: req.user.id,
    date: { $gte: todayStart, $lte: todayEnd }
  });

  const activeSessions = await AttendanceSession.find({
    status: 'active',
    sessionDate: { $gte: todayStart, $lte: todayEnd }
  }).select('type sessionId');

  res.json({
    success: true,
    data: {
      date: todayStart,
      checkInTime: record?.checkInTime || null,
      checkOutTime: record?.checkOutTime || null,
      status: record?.status || 'not_checked_in',
      workingDuration: record?.workingDuration || 0,
      activeCheckIn: activeSessions.some((s) => s.type === 'CHECK_IN'),
      activeCheckOut: activeSessions.some((s) => s.type === 'CHECK_OUT')
    }
  });
}

async function getMyHistory(req, res) {
  const { page = 1, limit = 30 } = req.query;
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.max(parseInt(limit, 10) || 30, 1);

  const [records, total] = await Promise.all([
    AttendanceRecord.find({ employeeId: req.user.id })
      .sort({ date: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    AttendanceRecord.countDocuments({ employeeId: req.user.id })
  ]);

  res.json({
    success: true,
    data: records.map((r) => ({
      date: r.date,
      checkInTime: r.checkInTime,
      checkOutTime: r.checkOutTime,
      status: r.status,
      workingDuration: r.workingDuration
    })),
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
  });
}

async function getAttendanceHistory(req, res) {
  const scope = await getManagerDepartmentScope(req.user.id);
  if (!scope) return res.status(403).json({ success: false, error: 'Unauthorized' });

  const { from, to, employeeId, departmentId, status, page = 1, limit = 50 } = req.query;
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.max(parseInt(limit, 10) || 50, 1);

  const userQuery = applyScopeToUserQuery(scope);
  userQuery.role = 'staff';
  if (departmentId) userQuery.departmentId = departmentId;
  const staffList = await User.find(userQuery).select('_id');
  const staffIds = staffList.map((s) => s._id);

  const query = { employeeId: { $in: staffIds } };
  if (employeeId) query.employeeId = employeeId;
  if (status) query.status = status;
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = startOfDay(from);
    if (to) query.date.$lte = endOfDay(to);
  }

  const [records, total] = await Promise.all([
    AttendanceRecord.find(query)
      .populate({ path: 'employeeId', select: 'name email employeeId departmentId', populate: { path: 'departmentId', select: 'name' } })
      .sort({ date: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    AttendanceRecord.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: records.map((r) => ({
      id: r._id,
      date: r.date,
      employeeId: r.employeeId?._id,
      employeeName: r.employeeId?.name || 'Unknown',
      email: r.employeeId?.email || '',
      employeeCode: r.employeeId?.employeeId || '',
      department: r.employeeId?.departmentId?.name || '',
      checkInTime: r.checkInTime,
      checkOutTime: r.checkOutTime,
      status: r.status,
      workingDuration: r.workingDuration
    })),
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
  });
}

async function updateAttendanceRecord(req, res) {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Only admin can override attendance records' });

  const { id } = req.params;
  const { checkInTime, checkOutTime, status } = req.body;

  const record = await AttendanceRecord.findById(id);
  if (!record) return res.status(404).json({ success: false, error: 'Attendance record not found' });

  if (checkInTime) record.checkInTime = new Date(checkInTime);
  if (checkOutTime) record.checkOutTime = new Date(checkOutTime);
  if (status) record.status = status;
  if (record.checkInTime && record.checkOutTime) {
    record.workingDuration = Math.max(0, Math.round((new Date(record.checkOutTime).getTime() - new Date(record.checkInTime).getTime()) / 60000));
  }
  record.updatedAt = new Date();
  await record.save();

  await logAction({ userId: req.user.id, action: 'ADMIN_MODIFY_ATTENDANCE', details: `recordId=${record._id}`, req });

  res.json({ success: true, data: { id: record._id } });
}

module.exports = {
  startCheckInSession,
  startCheckOutSession,
  closeSession,
  getSessionQr,
  getTodaySessions,
  checkIn,
  checkOut,
  getTodayAttendance,
  getMyAttendanceToday,
  getMyHistory,
  getAttendanceHistory,
  updateAttendanceRecord,
  getAttendanceSettings
};
