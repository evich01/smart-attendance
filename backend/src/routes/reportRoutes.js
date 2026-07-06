const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const {
  courseReport, institutionReport, studentHistory, exportCourseCsv
} = require('../controllers/reportController');

router.use(auth);

router.get('/course/:courseId', rbac('lecturer', 'admin'), asyncHandler(courseReport));
router.get('/institution', rbac('admin'), asyncHandler(institutionReport));
router.get('/student/history', rbac('student'), asyncHandler(studentHistory));
router.get('/export/:courseId', rbac('lecturer', 'admin'), asyncHandler(exportCourseCsv));

module.exports = router;
