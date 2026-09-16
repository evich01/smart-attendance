const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Department = require('../models/Department');
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
    phone: user.phone || '',
    role: user.role,
    isActive: user.isActive,
    employeeId: user.employeeId || '',
    departmentId: user.departmentId || null
  };
}

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

async function register(req, res) {
  const { name, email, password, role, phone, departmentId } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, error: 'name, email, password, and role are required' });
  }
  if (!['admin', 'manager', 'staff'].includes(role)) {
    return res.status(400).json({ success: false, error: 'role must be admin, manager, or staff' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ success: false, error: 'Email is already registered' });
  }

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

  await logAction({ userId: user._id, action: 'REGISTER', details: `role=${role}`, req });

  const token = signToken(user);
  res.status(201).json({ success: true, data: { token, user: sanitizeUser(user) } });
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).populate('departmentId', 'name');
  if (!user || !user.isActive) {
    return res.status(401).json({ success: false, error: 'Invalid credentials or inactive account' });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  await logAction({ userId: user._id, action: 'LOGIN', req });

  const token = signToken(user);
  const userData = sanitizeUser(user);
  if (user.departmentId) userData.departmentName = user.departmentId.name;
  res.json({ success: true, data: { token, user: userData } });
}

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

async function me(req, res) {
  const user = await User.findById(req.user.id).populate('departmentId', 'name');
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  const data = sanitizeUser(user);
  if (user.departmentId) {
    data.departmentName = user.departmentId.name;
  }
  res.json({ success: true, data });
}

module.exports = { register, login, changePassword, me };
