const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const {
  listUsers, createUser, updateUser, deleteUser, toggleStatus, userStats, listLecturers
} = require('../controllers/userController');

router.use(auth, rbac('admin'));

router.get('/stats', asyncHandler(userStats));
router.get('/lecturers', asyncHandler(listLecturers));
router.get('/', asyncHandler(listUsers));
router.post('/', asyncHandler(createUser));
router.put('/:id', asyncHandler(updateUser));
router.delete('/:id', asyncHandler(deleteUser));
router.patch('/:id/status', asyncHandler(toggleStatus));

module.exports = router;
