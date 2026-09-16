const AttendanceRecord = require('../models/AttendanceRecord');
const AttendanceSession = require('../models/AttendanceSession');
const User = require('../models/User');
const Department = require('../models/Department');
const { buildAttendanceCsv } = require('../utils/csvExporter');

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

async function getScope(userId, role) {
  if (role === 'admin') return { all: true };
  if (role === 'manager') {
    const depts = await Department.find({ managerId: userId }).select('_id');
    return { all: false, departmentIds: depts.map((d) => d._id) };
  }
  return null;
}

async function attendanceReport(req, res) {
  const scope = await getScope(req.user.id, req.user.role);
  if (!scope) return res.status(403).json({ success: false, error: 'Unauthorized' });

  const { from, to, employeeId, departmentId, status } = req.query;

  const userQuery = { role: 'staff', isActive: true };
  if (!scope.all) userQuery.departmentId = { $in: scope.departmentIds };
  if (departmentId) userQuery.departmentId = departmentId;
  const staffList = await User.find(userQuery).select('_id name email employeeId departmentId').populate('departmentId', 'name');
  const staffIds = staffList.map((s) => s._id);
  const staffMap = new Map(staffList.map((s) => [String(s._id), s]));

  const query = { employeeId: { $in: staffIds } };
  if (employeeId) query.employeeId = employeeId;
  if (status) query.status = status;
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = startOfDay(from);
    if (to) query.date.$lte = endOfDay(to);
  }

  const records = await AttendanceRecord.find(query).sort({ date: -1 });

  const summary = { total: records.length, present: 0, late: 0, absent: 0, missing_checkout: 0, not_checked_in: 0, totalWorkingMinutes: 0 };
  const rows = records.map((r) => {
    const s = staffMap.get(String(r.employeeId));
    const st = r.status;
    if (st === 'present') summary.present++;
    else if (st === 'late') summary.late++;
    else if (st === 'absent') summary.absent++;
    else if (st === 'missing_checkout') summary.missing_checkout++;
    else if (st === 'not_checked_in') summary.not_checked_in++;
    summary.totalWorkingMinutes += r.workingDuration || 0;
    return {
      employeeName: s?.name || 'Unknown',
      email: s?.email || '',
      employeeId: s?.employeeId || '',
      department: s?.departmentId?.name || '',
      date: r.date,
      checkInTime: r.checkInTime,
      checkOutTime: r.checkOutTime,
      status: r.status,
      workingDuration: r.workingDuration || 0
    };
  });

  summary.averageWorkingHours = summary.totalWorkingMinutes > 0 && records.length > 0
    ? (summary.totalWorkingMinutes / 60 / records.length).toFixed(2)
    : 0;

  res.json({ success: true, data: { summary, rows } });
}

async function exportAttendanceCsv(req, res) {
  const scope = await getScope(req.user.id, req.user.role);
  if (!scope) return res.status(403).json({ success: false, error: 'Unauthorized' });

  const { from, to, employeeId, departmentId, status } = req.query;

  const userQuery = { role: 'staff', isActive: true };
  if (!scope.all) userQuery.departmentId = { $in: scope.departmentIds };
  if (departmentId) userQuery.departmentId = departmentId;
  const staffList = await User.find(userQuery).select('_id name email employeeId departmentId').populate('departmentId', 'name');
  const staffIds = staffList.map((s) => s._id);
  const staffMap = new Map(staffList.map((s) => [String(s._id), s]));

  const query = { employeeId: { $in: staffIds } };
  if (employeeId) query.employeeId = employeeId;
  if (status) query.status = status;
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = startOfDay(from);
    if (to) query.date.$lte = endOfDay(to);
  }

  const records = await AttendanceRecord.find(query).sort({ date: -1 });

  const rows = records.map((r) => {
    const s = staffMap.get(String(r.employeeId));
    return {
      employeeName: s?.name || 'Unknown',
      email: s?.email || '',
      employeeId: s?.employeeId || '',
      department: s?.departmentId?.name || '',
      date: r.date ? new Date(r.date).toISOString().slice(0, 10) : '',
      checkInTime: r.checkInTime ? new Date(r.checkInTime).toISOString() : '',
      checkOutTime: r.checkOutTime ? new Date(r.checkOutTime).toISOString() : '',
      status: r.status,
      workingDuration: r.workingDuration || 0
    };
  });

  const csv = buildAttendanceCsv(rows);
  res.header('Content-Type', 'text/csv');
  res.attachment(`attendance_${Date.now()}.csv`);
  res.send(csv);
}

async function dashboardAnalytics(req, res) {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Unauthorized' });

  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);

  const records = await AttendanceRecord.find({ date: { $gte: since } }).select('date status workingDuration');
  const dailyMap = {};
  for (let i = 0; i < 14; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    dailyMap[key] = { date: key, present: 0, late: 0, absent: 0, total: 0, avgMinutes: 0, totalMinutes: 0 };
  }
  records.forEach((r) => {
    const key = new Date(r.date).toISOString().slice(0, 10);
    if (dailyMap[key]) {
      dailyMap[key].total++;
      if (r.status === 'present') dailyMap[key].present++;
      else if (r.status === 'late') dailyMap[key].late++;
      else if (r.status === 'absent') dailyMap[key].absent++;
      dailyMap[key].totalMinutes += r.workingDuration || 0;
    }
  });
  const dailyTrend = Object.values(dailyMap).map((d) => ({
    ...d,
    avgHours: d.total > 0 ? (d.totalMinutes / 60 / d.total).toFixed(1) : 0
  }));

  const departments = await Department.find({}).sort({ name: 1 });
  const departmentStats = await Promise.all(departments.map(async (d) => {
    const staffIds = (await User.find({ departmentId: d._id, role: 'staff', isActive: true }).select('_id')).map((u) => u._id);
    const today = startOfDay();
    const todayRecs = await AttendanceRecord.find({ employeeId: { $in: staffIds }, date: { $gte: today, $lte: endOfDay() } });
    let present = 0, late = 0;
    todayRecs.forEach((r) => {
      if (r.status === 'present') present++;
      else if (r.status === 'late') late++;
    });
    return {
      id: d._id,
      name: d.name,
      totalStaff: staffIds.length,
      todayPresent: present,
      todayLate: late,
      todayAbsent: Math.max(0, staffIds.length - todayRecs.length)
    };
  }));

  const statusPie = {
    present: dailyTrend.reduce((a, d) => a + d.present, 0),
    late: dailyTrend.reduce((a, d) => a + d.late, 0),
    absent: dailyTrend.reduce((a, d) => a + d.absent, 0)
  };

  res.json({
    success: true,
    data: { dailyTrend, departmentStats, statusPie }
  });
}

module.exports = { attendanceReport, exportAttendanceCsv, dashboardAnalytics };
