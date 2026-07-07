const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Student = require('../models/Student');
const Lecturer = require('../models/Lecturer');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');

const BCRYPT_ROUNDS = 12;

async function generateStudentNumber() {
  const lastStudent = await Student.findOne().sort({ studentNumber: -1 });
  if (!lastStudent) {
    return 'STU-001';
  }
  const lastNumber = parseInt(lastStudent.studentNumber.split('-')[1], 10);
  const newNumber = lastNumber + 1;
  return `STU-${String(newNumber).padStart(3, '0')}`;
}

async function generateStaffId() {
  const lastLecturer = await Lecturer.findOne().sort({ staffId: -1 });
  if (!lastLecturer) {
    return 'STF-001';
  }
  const lastNumber = parseInt(lastLecturer.staffId.split('-')[1], 10);
  const newNumber = lastNumber + 1;
  return `STF-${String(newNumber).padStart(3, '0')}`;
}

// GET /api/users?search=&role=&page=&limit=
async function listUsers(req, res) {
  const { search = '', role = '', page = 1, limit = 10 } = req.query;
  const query = {};
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.max(parseInt(limit, 10) || 10, 1);

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    User.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: users.map((u) => ({
      id: u._id, name: u.name, email: u.email, role: u.role, isActive: u.isActive, createdAt: u.createdAt
    })),
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
  });
}

// GET /api/users/lecturers — get all lecturers with their lecturer profile
async function listLecturers(req, res) {
  const lecturers = await Lecturer.find({}).populate('userId', 'name email');
  res.json({
    success: true,
    data: lecturers.map((l) => ({
      id: l._id,
      userId: l.userId._id,
      name: l.userId.name,
      email: l.userId.email,
      staffId: l.staffId,
      department: l.department
    }))
  });
}

// POST /api/users
async function createUser(req, res) {
  const { name, email, password, role, department, yearLevel, program, specialisation } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, error: 'name, email, password, and role are required' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ success: false, error: 'Email already in use' });

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({ name, email: email.toLowerCase(), passwordHash, role });

  if (role === 'student') {
    const finalStudentNumber = await generateStudentNumber();
    await Student.create({ userId: user._id, studentNumber: finalStudentNumber, department, yearLevel, program });
  } else if (role === 'lecturer') {
    const finalStaffId = await generateStaffId();
    await Lecturer.create({ userId: user._id, staffId: finalStaffId, department, specialisation });
  }

  res.status(201).json({ success: true, data: { id: user._id, name: user.name, email: user.email, role: user.role } });
}

// PUT /api/users/:id
async function updateUser(req, res) {
  const { name, email, isActive } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });

  if (name) user.name = name;
  if (email) user.email = email.toLowerCase();
  if (typeof isActive === 'boolean') user.isActive = isActive;
  await user.save();

  res.json({ success: true, data: { id: user._id, name: user.name, email: user.email, isActive: user.isActive } });
}

// DELETE /api/users/:id
async function deleteUser(req, res) {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });

  if (user.role === 'student') await Student.deleteOne({ userId: user._id });
  if (user.role === 'lecturer') await Lecturer.deleteOne({ userId: user._id });

  res.json({ success: true, data: { message: 'User deleted' } });
}

// PATCH /api/users/:id/status
async function toggleStatus(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });

  user.isActive = !user.isActive;
  await user.save();

  res.json({ success: true, data: { id: user._id, isActive: user.isActive } });
}

// GET /api/users/stats — aggregate stats for admin dashboard
async function userStats(req, res) {
  const [totalAdmins, totalLecturers, totalStudents, totalSessions, totalAttendance] = await Promise.all([
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ role: 'lecturer' }),
    User.countDocuments({ role: 'student' }),
    AttendanceSession.countDocuments({}),
    AttendanceRecord.countDocuments({})
  ]);

  res.json({
    success: true,
    data: {
      usersByRole: { admin: totalAdmins, lecturer: totalLecturers, student: totalStudents },
      totalUsers: totalAdmins + totalLecturers + totalStudents,
      totalSessions,
      totalAttendanceRecords: totalAttendance
    }
  });
}

module.exports = { listUsers, createUser, updateUser, deleteUser, toggleStatus, userStats, listLecturers };
