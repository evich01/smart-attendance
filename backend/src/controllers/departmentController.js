const Department = require('../models/Department');
const User = require('../models/User');
const { logAction } = require('../utils/logger');

async function listDepartments(req, res) {
  const departments = await Department.find({})
    .populate('managerId', 'name email')
    .sort({ name: 1 });
  const withCounts = await Promise.all(departments.map(async (d) => {
    const staffCount = await User.countDocuments({ departmentId: d._id, role: 'staff', isActive: true });
    return {
      id: d._id,
      name: d.name,
      description: d.description,
      managerId: d.managerId?._id || null,
      managerName: d.managerId?.name || '',
      staffCount,
      createdAt: d.createdAt
    };
  }));
  res.json({ success: true, data: withCounts });
}

async function createDepartment(req, res) {
  const { name, description, managerId } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'Department name is required' });

  const existing = await Department.findOne({ name });
  if (existing) return res.status(409).json({ success: false, error: 'Department already exists' });

  if (managerId) {
    const mgr = await User.findById(managerId);
    if (!mgr) return res.status(400).json({ success: false, error: 'Invalid manager' });
  }

  const dept = await Department.create({ name, description: description || '', managerId: managerId || null });

  await logAction({ userId: req.user.id, action: 'ADMIN_CREATE_DEPARTMENT', details: `name=${name}`, req });

  res.status(201).json({ success: true, data: { id: dept._id, name: dept.name } });
}

async function updateDepartment(req, res) {
  const { name, description, managerId } = req.body;
  const dept = await Department.findById(req.params.id);
  if (!dept) return res.status(404).json({ success: false, error: 'Department not found' });

  if (name) dept.name = name;
  if (typeof description !== 'undefined') dept.description = description || '';
  if (managerId !== undefined) {
    if (managerId) {
      const mgr = await User.findById(managerId);
      if (!mgr) return res.status(400).json({ success: false, error: 'Invalid manager' });
    }
    dept.managerId = managerId || null;
  }
  await dept.save();

  await logAction({ userId: req.user.id, action: 'ADMIN_UPDATE_DEPARTMENT', details: `departmentId=${dept._id}`, req });

  res.json({ success: true, data: { id: dept._id, name: dept.name } });
}

async function deleteDepartment(req, res) {
  const dept = await Department.findByIdAndDelete(req.params.id);
  if (!dept) return res.status(404).json({ success: false, error: 'Department not found' });

  await User.updateMany({ departmentId: dept._id }, { departmentId: null });

  await logAction({ userId: req.user.id, action: 'ADMIN_DELETE_DEPARTMENT', details: `name=${dept.name}`, req });

  res.json({ success: true, data: { message: 'Department deleted' } });
}

module.exports = { listDepartments, createDepartment, updateDepartment, deleteDepartment };
