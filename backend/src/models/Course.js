const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, trim: true, uppercase: true },
  name: { type: String, required: true, trim: true },
  lecturerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lecturer', default: null },
  credits: { type: Number, default: 3 },
  semester: { type: String, default: '' },
  academicYear: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Course', courseSchema);
