const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const {
  listCourses, myCourses, enrolledCourses, createCourse, updateCourse, deleteCourse, enrollStudent, getUnenrolledStudents
} = require('../controllers/courseController');

router.use(auth);

router.get('/', rbac('admin'), asyncHandler(listCourses));
router.get('/my', rbac('lecturer'), asyncHandler(myCourses));
router.get('/enrolled', rbac('student'), asyncHandler(enrolledCourses));
router.post('/', rbac('admin'), asyncHandler(createCourse));
router.put('/:id', rbac('admin'), asyncHandler(updateCourse));
router.delete('/:id', rbac('admin'), asyncHandler(deleteCourse));
router.post('/:id/enroll', rbac('admin'), asyncHandler(enrollStudent));
router.get('/:id/unenrolled-students', rbac('admin'), asyncHandler(getUnenrolledStudents));

module.exports = router;
