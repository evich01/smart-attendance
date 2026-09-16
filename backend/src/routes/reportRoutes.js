const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const {
  attendanceReport, exportAttendanceCsv, dashboardAnalytics
} = require('../controllers/reportController');

router.use(auth);

router.get('/attendance', rbac('manager', 'admin'), asyncHandler(attendanceReport));
router.get('/export/attendance', rbac('manager', 'admin'), asyncHandler(exportAttendanceCsv));
router.get('/dashboard', rbac('admin'), asyncHandler(dashboardAnalytics));

module.exports = router;
