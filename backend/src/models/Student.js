const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  studentNumber: { type: String, required: true, unique: true, trim: true },
  department: { type: String, default: '' },
  yearLevel: { type: Number, default: 1 },
  program: { type: String, default: '' }
});


module.exports = mongoose.model('Student', studentSchema);
