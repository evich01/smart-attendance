const Course = require('../models/Course');
const Lecturer = require('../models/Lecturer');
const Student = require('../models/Student');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');

// GET /api/courses (Admin — list all)
async function listCourses(req, res) {
  const courses = await Course.find({}).populate({
    path: 'lecturerId',
    populate: { path: 'userId', select: 'name email' }
  }).sort({ createdAt: -1 });

  res.json({ success: true, data: courses });
}

// GET /api/courses/my (Lecturer)
async function myCourses(req, res) {
  const lecturer = await Lecturer.findOne({ userId: req.user.id });
  if (!lecturer) return res.status(404).json({ success: false, error: 'Lecturer profile not found' });

  const courses = await Course.find({ lecturerId: lecturer._id, isActive: true }).sort({ createdAt: -1 });
  res.json({ success: true, data: courses });
}

// GET /api/courses/enrolled (Student)
async function enrolledCourses(req, res) {
  const student = await Student.findOne({ userId: req.user.id });
  if (!student) return res.status(404).json({ success: false, error: 'Student profile not found' });

  const enrollments = await Enrollment.find({ studentId: student._id }).populate('courseId');
  res.json({ success: true, data: enrollments.map((e) => e.courseId) });
}

// POST /api/courses
async function createCourse(req, res) {
  const { code, name, lecturerId, credits, semester, academicYear } = req.body;
  if (!code || !name) return res.status(400).json({ success: false, error: 'code and name are required' });

  const course = await Course.create({ code, name, lecturerId: lecturerId || null, credits, semester, academicYear });
  res.status(201).json({ success: true, data: course });
}

// PUT /api/courses/:id
async function updateCourse(req, res) {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ success: false, error: 'Course not found' });

  const { name, lecturerId, credits, semester, academicYear, isActive } = req.body;
  if (name) course.name = name;
  if (lecturerId !== undefined) course.lecturerId = lecturerId || null;
  if (credits !== undefined) course.credits = credits;
  if (semester !== undefined) course.semester = semester;
  if (academicYear !== undefined) course.academicYear = academicYear;
  if (typeof isActive === 'boolean') course.isActive = isActive;

  await course.save();
  res.json({ success: true, data: course });
}

// DELETE /api/courses/:id
async function deleteCourse(req, res) {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) return res.status(404).json({ success: false, error: 'Course not found' });
  await Enrollment.deleteMany({ courseId: course._id });
  res.json({ success: true, data: { message: 'Course deleted' } });
}

// POST /api/courses/:id/enroll — enrol a student by email lookup
async function enrollStudent(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, error: 'email is required' });

  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ success: false, error: 'Course not found' });

  const user = await User.findOne({ email: email.toLowerCase(), role: 'student' });
  if (!user) return res.status(404).json({ success: false, error: 'No student found with that email' });

  const student = await Student.findOne({ userId: user._id });
  if (!student) return res.status(404).json({ success: false, error: 'Student profile not found' });

  const existing = await Enrollment.findOne({ studentId: student._id, courseId: course._id });
  if (existing) return res.status(409).json({ success: false, error: 'Student is already enrolled in this course' });

  const enrollment = await Enrollment.create({ studentId: student._id, courseId: course._id });
  res.status(201).json({ success: true, data: enrollment });
}

module.exports = {
  listCourses, myCourses, enrolledCourses, createCourse, updateCourse, deleteCourse, enrollStudent
};
