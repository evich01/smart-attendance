const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Lecturer = require('../models/Lecturer');
const { logAction } = require('../utils/logger');

const BCRYPT_ROUNDS = 12;

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '24h' }
  );
}

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive
  };
}

// Helper function to generate student number
async function generateStudentNumber() {
  const lastStudent = await Student.findOne().sort({ studentNumber: -1 });
  if (!lastStudent) {
    return 'STU-001';
  }
  const lastNumber = parseInt(lastStudent.studentNumber.split('-')[1], 10);
  const newNumber = lastNumber + 1;
  return `STU-${String(newNumber).padStart(3, '0')}`;
}

// POST /api/auth/register
async function register(req, res) {
  const { name, email, password, role, studentNumber, staffId, department, yearLevel, program, specialisation } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, error: 'name, email, password, and role are required' });
  }
  if (!['admin', 'lecturer', 'student'].includes(role)) {
    return res.status(400).json({ success: false, error: 'role must be admin, lecturer, or student' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ success: false, error: 'Email is already registered' });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({ name, email: email.toLowerCase(), passwordHash, role });

  if (role === 'student') {
    let finalStudentNumber = studentNumber;
    if (!finalStudentNumber) {
      finalStudentNumber = await generateStudentNumber();
    }
    await Student.create({ userId: user._id, studentNumber: finalStudentNumber, department, yearLevel, program });
  } else if (role === 'lecturer') {
    if (!staffId) {
      return res.status(400).json({ success: false, error: 'staffId is required for lecturer registration' });
    }
    await Lecturer.create({ userId: user._id, staffId, department, specialisation });
  }

  await logAction({ userId: user._id, action: 'REGISTER', details: `role=${role}`, req });

  const token = signToken(user);
  res.status(201).json({ success: true, data: { token, user: sanitizeUser(user) } });
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.isActive) {
    return res.status(401).json({ success: false, error: 'Invalid credentials or inactive account' });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  await logAction({ userId: user._id, action: 'LOGIN', req });

  const token = signToken(user);
  res.json({ success: true, data: { token, user: sanitizeUser(user) } });
}

// PUT /api/auth/change-password
async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'currentPassword and newPassword are required' });
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  const match = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!match) {
    return res.status(401).json({ success: false, error: 'Current password is incorrect' });
  }

  user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await user.save();

  await logAction({ userId: user._id, action: 'CHANGE_PASSWORD', req });

  res.json({ success: true, data: { message: 'Password updated successfully' } });
}

// GET /api/auth/me
async function me(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  res.json({ success: true, data: sanitizeUser(user) });
}

module.exports = { register, login, changePassword, me };
