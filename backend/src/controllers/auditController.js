const Log = require('../models/Log');
const User = require('../models/User');

async function listAuditLogs(req, res) {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Unauthorized' });

  const { action = '', page = 1, limit = 50 } = req.query;
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.max(parseInt(limit, 10) || 50, 1);

  const query = {};
  if (action) query.action = { $regex: action, $options: 'i' };

  const [logs, total] = await Promise.all([
    Log.find(query)
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Log.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: logs.map((l) => ({
      id: l._id,
      userId: l.userId?._id || null,
      userName: l.userId?.name || 'System',
      userEmail: l.userId?.email || '',
      userRole: l.userId?.role || '',
      action: l.action,
      details: l.details,
      ipAddress: l.ipAddress,
      timestamp: l.timestamp
    })),
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
  });
}

module.exports = { listAuditLogs };
