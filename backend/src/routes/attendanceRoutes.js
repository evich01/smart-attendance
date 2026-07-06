const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const {
  createSession, getSessionQr, endSession, liveAttendance, scanAttendance
} = require('../controllers/attendanceController');

router.use(auth);

router.post('/session', rbac('lecturer'), asyncHandler(createSession));
router.get('/session/:id/qr', rbac('lecturer'), asyncHandler(getSessionQr));
router.patch('/session/:id/end', rbac('lecturer'), asyncHandler(endSession));
router.get('/session/:id/live', rbac('lecturer', 'admin'), asyncHandler(liveAttendance));
router.post('/scan', rbac('student'), asyncHandler(scanAttendance));

module.exports = router;
