const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const {
  listDepartments, createDepartment, updateDepartment, deleteDepartment
} = require('../controllers/departmentController');

router.use(auth);

router.get('/', rbac('admin', 'manager'), asyncHandler(listDepartments));

router.use(rbac('admin'));
router.post('/', asyncHandler(createDepartment));
router.put('/:id', asyncHandler(updateDepartment));
router.delete('/:id', asyncHandler(deleteDepartment));

module.exports = router;
