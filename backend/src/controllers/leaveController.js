const Leave = require('../models/Leave');
const User = require('../models/User');
const Department = require('../models/Department');
const { logAction } = require('../utils/logger');

function startOfDay(d) {
  const date = d ? new Date(d) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

async function getReviewScope(userId) {
  const user = await User.findById(userId);
  if (!user) return null;
  if (user.role === 'admin') return { all: true };
  if (user.role === 'manager') {
    const depts = await Department.find({ managerId: userId }).select('_id');
    const staff = await User.find({ departmentId: { $in: depts.map((d) => d._id) }, role: 'staff' }).select('_id');
    return { all: false, employeeIds: staff.map((s) => s._id) };
  }
  return null;
}

async function submitLeave(req, res) {
  const { type, startDate, endDate, reason } = req.body;
  if (!type || !startDate || !endDate || !reason) {
    return res.status(400).json({ success: false, error: 'type, startDate, endDate, and reason are required' });
  }
  if (!['annual', 'sick', 'personal', 'other'].includes(type)) {
    return res.status(400).json({ success: false, error: 'Invalid leave type' });
  }
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);
  if (end < start) return res.status(400).json({ success: false, error: 'endDate must be on or after startDate' });

  const leave = await Leave.create({
    employeeId: req.user.id,
    type,
    startDate: start,
    endDate: end,
    reason,
    status: 'pending'
  });

  await logAction({ userId: req.user.id, action: 'LEAVE_SUBMIT', details: `leaveId=${leave._id}, type=${type}`, req });

  res.status(201).json({ success: true, data: { id: leave._id, status: leave.status } });
}

async function myLeaves(req, res) {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.max(parseInt(limit, 10) || 20, 1);

  const [leaves, total] = await Promise.all([
    Leave.find({ employeeId: req.user.id }).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    Leave.countDocuments({ employeeId: req.user.id })
  ]);

  res.json({
    success: true,
    data: leaves.map((l) => ({
      id: l._id,
      type: l.type,
      startDate: l.startDate,
      endDate: l.endDate,
      reason: l.reason,
      status: l.status,
      reviewNotes: l.reviewNotes || '',
      reviewedAt: l.reviewedAt || null,
      createdAt: l.createdAt
    })),
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
  });
}

async function reviewLeaves(req, res) {
  const scope = await getReviewScope(req.user.id);
  if (!scope) return res.status(403).json({ success: false, error: 'Unauthorized' });
  const { status = '', page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.max(parseInt(limit, 10) || 20, 1);

  const query = {};
  if (!scope.all) query.employeeId = { $in: scope.employeeIds };
  if (status && ['pending', 'approved', 'rejected'].includes(status)) query.status = status;

  const [leaves, total] = await Promise.all([
    Leave.find(query)
      .populate('employeeId', 'name email employeeId')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Leave.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: leaves.map((l) => ({
      id: l._id,
      employeeId: l.employeeId?._id,
      employeeName: l.employeeId?.name || 'Unknown',
      employeeEmail: l.employeeId?.email || '',
      employeeCode: l.employeeId?.employeeId || '',
      type: l.type,
      startDate: l.startDate,
      endDate: l.endDate,
      reason: l.reason,
      status: l.status,
      reviewNotes: l.reviewNotes || '',
      reviewedAt: l.reviewedAt || null,
      reviewedBy: l.reviewedBy || null,
      createdAt: l.createdAt
    })),
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
  });
}

async function approveReject(req, res) {
  const scope = await getReviewScope(req.user.id);
  if (!scope) return res.status(403).json({ success: false, error: 'Unauthorized' });
  const { status, reviewNotes } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, error: 'status must be approved or rejected' });
  }

  const leave = await Leave.findById(req.params.id);
  if (!leave) return res.status(404).json({ success: false, error: 'Leave request not found' });
  if (!scope.all) {
    const allowed = scope.employeeIds.some((id) => String(id) === String(leave.employeeId));
    if (!allowed) return res.status(403).json({ success: false, error: 'Not authorized to review this request' });
  }

  leave.status = status;
  leave.reviewedBy = req.user.id;
  leave.reviewedAt = new Date();
  leave.reviewNotes = reviewNotes || '';
  leave.updatedAt = new Date();
  await leave.save();

  const action = status === 'approved' ? 'MANAGER_APPROVE_LEAVE' : 'MANAGER_REJECT_LEAVE';
  await logAction({ userId: req.user.id, action, details: `leaveId=${leave._id}`, req });

  res.json({ success: true, data: { id: leave._id, status: leave.status } });
}

module.exports = { submitLeave, myLeaves, reviewLeaves, approveReject };
