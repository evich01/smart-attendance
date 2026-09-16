const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Department = require('../models/Department');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const { logAction } = require('../utils/logger');

const BCRYPT_ROUNDS = 12;

async function generateEmployeeId(role) {
  const prefix = role === 'manager' ? 'MGR' : role === 'staff' ? 'EMP' : 'ADM';
  const lastUser = await User.findOne({ role }).sort({ employeeId: -1 });
  let nextNum = 1;
  if (lastUser && lastUser.employeeId) {
    const match = lastUser.employeeId.match(/-(\d+)$/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  return `${prefix}-${String(nextNum).padStart(4, '0')}`;
}

function sanitizeUser(u) {
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    phone: u.phone || '',
    role: u.role,
    isActive: u.isActive,
    employeeId: u.employeeId || '',
    departmentId: u.departmentId || null,
    departmentName: u.departmentId?.name || '',
    createdAt: u.createdAt
  };
}

async function listUsers(req, res) {
  const { search = '', role = '', departmentId = '', page = 1, limit = 20 } = req.query;
  const query = {};
  if (role) query.role = role;
  if (departmentId) query.departmentId = departmentId;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } }
    ];
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.max(parseInt(limit, 10) || 20, 1);

  const [users, total] = await Promise.all([
    User.find(query)
      .populate('departmentId', 'name')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    User.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: users.map(sanitizeUser),
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
  });
}

async function createUser(req, res) {
  const { name, email, password, role, phone, departmentId } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, error: 'name, email, password, and role are required' });
  }
  if (!['admin', 'manager', 'staff'].includes(role)) {
    return res.status(400).json({ success: false, error: 'role must be admin, manager, or staff' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ success: false, error: 'Email already in use' });

  if (departmentId) {
    const dept = await Department.findById(departmentId);
    if (!dept) return res.status(400).json({ success: false, error: 'Invalid department' });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const employeeId = await generateEmployeeId(role);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    phone: phone || '',
    passwordHash,
    role,
    employeeId,
    departmentId: departmentId || null
  });

  await logAction({ userId: req.user?.id || user._id, action: 'ADMIN_CREATE_USER', details: `email=${email}, role=${role}`, req });

  res.status(201).json({ success: true, data: { id: user._id, name: user.name, email: user.email, role: user.role } });
}

async function updateUser(req, res) {
  const { name, email, isActive, phone, departmentId, role } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });

  if (name) user.name = name;
  if (email) user.email = email.toLowerCase();
  if (typeof isActive === 'boolean') user.isActive = isActive;
  if (typeof phone !== 'undefined') user.phone = phone || '';
  if (departmentId !== undefined) {
    if (departmentId) {
      const dept = await Department.findById(departmentId);
      if (!dept) return res.status(400).json({ success: false, error: 'Invalid department' });
    }
    user.departmentId = departmentId || null;
  }
  if (role && ['admin', 'manager', 'staff'].includes(role)) user.role = role;
  await user.save();

  await logAction({ userId: req.user.id, action: 'ADMIN_UPDATE_USER', details: `userId=${user._id}`, req });

  res.json({ success: true, data: { id: user._id, name: user.name, email: user.email, isActive: user.isActive } });
}

async function deleteUser(req, res) {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });

  await logAction({ userId: req.user.id, action: 'ADMIN_DELETE_USER', details: `userId=${user._id}, email=${user.email}`, req });

  res.json({ success: true, data: { message: 'User deleted' } });
}

async function toggleStatus(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });

  user.isActive = !user.isActive;
  await user.save();

  await logAction({ userId: req.user.id, action: 'ADMIN_TOGGLE_USER_STATUS', details: `userId=${user._id}, isActive=${user.isActive}`, req });

  res.json({ success: true, data: { id: user._id, isActive: user.isActive } });
}

async function userStats(req, res) {
  const [totalAdmins, totalManagers, totalStaff, totalCheckInSessions, totalCheckOutSessions, totalRecords] = await Promise.all([
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ role: 'manager' }),
    User.countDocuments({ role: 'staff' }),
    AttendanceSession.countDocuments({ type: 'CHECK_IN' }),
    AttendanceSession.countDocuments({ type: 'CHECK_OUT' }),
    AttendanceRecord.countDocuments({})
  ]);

  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);

  const records = await AttendanceRecord.find({ date: { $gte: since } }).select('date status');
  const trendMap = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    trendMap[key] = { present: 0, late: 0, absent: 0, total: 0 };
  }
  records.forEach((r) => {
    const key = new Date(r.date).toISOString().slice(0, 10);
    if (trendMap[key]) {
      trendMap[key].total++;
      if (r.status === 'present') trendMap[key].present++;
      else if (r.status === 'late') trendMap[key].late++;
      else if (r.status === 'absent') trendMap[key].absent++;
    }
  });
  const attendanceTrend = Object.entries(trendMap).map(([date, stats]) => ({ date, ...stats }));

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const todayRecords = await AttendanceRecord.find({ date: { $gte: todayStart, $lte: todayEnd } });
  let todayPresent = 0, todayLate = 0, todayMissingCheckout = 0;
  todayRecords.forEach((r) => {
    if (r.status === 'present' && r.checkOutTime) todayPresent++;
    else if (r.status === 'late' && r.checkOutTime) todayLate++;
    else if (r.checkInTime && !r.checkOutTime) todayMissingCheckout++;
  });
  const todayNotCheckedIn = Math.max(0, totalStaff - todayRecords.length);

  res.json({
    success: true,
    data: {
      usersByRole: { admin: totalAdmins, manager: totalManagers, staff: totalStaff },
      totalUsers: totalAdmins + totalManagers + totalStaff,
      totalSessions: { checkIn: totalCheckInSessions, checkOut: totalCheckOutSessions },
      totalAttendanceRecords: totalRecords,
      attendanceTrend,
      today: {
        present: todayPresent,
        late: todayLate,
        missingCheckout: todayMissingCheckout,
        notCheckedIn: todayNotCheckedIn,
        totalStaff
      }
    }
  });
}

async function listStaff(req, res) {
  const scope = await (async () => {
    if (req.user.role === 'admin') return { all: true };
    if (req.user.role === 'manager') {
      const depts = await Department.find({ managerId: req.user.id }).select('_id');
      return { all: false, departmentIds: depts.map((d) => d._id) };
    }
    return null;
  })();
  if (!scope) return res.status(403).json({ success: false, error: 'Unauthorized' });

  const query = { role: 'staff', isActive: true };
  if (!scope.all) query.departmentId = { $in: scope.departmentIds };

  const staff = await User.find(query).populate('departmentId', 'name').select('_id name email employeeId departmentId phone');
  res.json({
    success: true,
    data: staff.map((s) => ({
      id: s._id,
      name: s.name,
      email: s.email,
      phone: s.phone || '',
      employeeId: s.employeeId || '',
      departmentId: s.departmentId?._id || null,
      departmentName: s.departmentId?.name || ''
    }))
  });
}

module.exports = { listUsers, createUser, updateUser, deleteUser, toggleStatus, userStats, listStaff };
