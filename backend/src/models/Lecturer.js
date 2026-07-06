const mongoose = require('mongoose');

const lecturerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  staffId: { type: String, required: true, unique: true, trim: true },
  department: { type: String, default: '' },
  specialisation: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Lecturer', lecturerSchema);
