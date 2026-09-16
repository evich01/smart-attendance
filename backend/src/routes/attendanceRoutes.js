const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const {
  startCheckInSession,
  startCheckOutSession,
  closeSession,
  getSessionQr,
  getTodaySessions,
  checkIn,
  checkOut,
  getTodayAttendance,
  getMyAttendanceToday,
  getMyHistory,
  getAttendanceHistory,
  updateAttendanceRecord
} = require('../controllers/attendanceController');

router.use(auth);

router.post('/sessions/check-in/start', rbac('manager', 'admin'), asyncHandler(startCheckInSession));
router.post('/sessions/check-out/start', rbac('manager', 'admin'), asyncHandler(startCheckOutSession));
router.patch('/sessions/:id/close', rbac('manager', 'admin'), asyncHandler(closeSession));
router.get('/sessions/:id/qr', rbac('manager', 'admin'), asyncHandler(getSessionQr));
router.get('/sessions/today', rbac('manager', 'admin', 'staff'), asyncHandler(getTodaySessions));

router.post('/check-in', rbac('staff'), asyncHandler(checkIn));
router.post('/check-out', rbac('staff'), asyncHandler(checkOut));

router.get('/today', rbac('manager', 'admin'), asyncHandler(getTodayAttendance));
router.get('/my-today', rbac('staff'), asyncHandler(getMyAttendanceToday));
router.get('/my-history', rbac('staff'), asyncHandler(getMyHistory));
router.get('/history', rbac('manager', 'admin'), asyncHandler(getAttendanceHistory));
router.put('/record/:id', rbac('admin'), asyncHandler(updateAttendanceRecord));

module.exports = router;
