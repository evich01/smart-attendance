require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

const User = require('../models/User');
const Student = require('../models/Student');
const Lecturer = require('../models/Lecturer');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Setting = require('../models/Setting');

const BCRYPT_ROUNDS = 12;

async function seed({ closeConnection = false } = {}) {
  await connectDB();
  console.log('[seed] Clearing existing demo collections...');
  await Promise.all([
    User.deleteMany({}), Student.deleteMany({}), Lecturer.deleteMany({}),
    Course.deleteMany({}), Enrollment.deleteMany({}), Setting.deleteMany({})
  ]);

  const pw = await bcrypt.hash('Demo@1234', BCRYPT_ROUNDS);

  const admin = await User.create({ name: 'System Admin', email: 'admin@demo.edu', passwordHash: pw, role: 'admin' });

  const lecturerUser = await User.create({ name: 'Dr. Ama Owusu', email: 'lecturer@demo.edu', passwordHash: pw, role: 'lecturer' });
  const lecturer = await Lecturer.create({ userId: lecturerUser._id, staffId: 'STF-001', department: 'Computer Science', specialisation: 'Software Engineering' });

  const studentUser = await User.create({ name: 'Kwame Mensah', email: 'student@demo.edu', passwordHash: pw, role: 'student' });
  const student = await Student.create({ userId: studentUser._id, studentNumber: 'STU-0001', department: 'Computer Science', yearLevel: 3, program: 'BSc. IT' });

  const course = await Course.create({
    code: 'CS301', name: 'Web Application Development', lecturerId: lecturer._id,
    credits: 3, semester: 'Semester 1', academicYear: '2025/2026'
  });

  await Enrollment.create({ studentId: student._id, courseId: course._id });

  await Setting.insertMany([
    { key: 'qrExpirySeconds', value: '30', label: 'QR Token Expiry Duration (seconds)' },
    { key: 'lateThresholdMinutes', value: '15', label: 'Late-Arrival Threshold (minutes)' },
    { key: 'institutionName', value: 'GCTU', label: 'Institution Name' },
    { key: 'academicYear', value: '2025/2026', label: 'Current Academic Year' },
    { key: 'currentSemester', value: 'Semester 1', label: 'Current Semester' }
  ]);

  console.log('[seed] Done. Demo accounts (password: Demo@1234):');
  console.log('  Admin:    admin@demo.edu');
  console.log('  Lecturer: lecturer@demo.edu');
  console.log('  Student:  student@demo.edu');

  if (closeConnection) {
    await mongoose.connection.close();
  }
  return { success: true };
}

// Only run automatically if called directly (not required)
if (require.main === module) {
  seed({ closeConnection: true }).catch((err) => {
    console.error('[seed] Failed:', err);
    process.exit(1);
  });
}

module.exports = seed;
