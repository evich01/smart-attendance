const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const {
  submitLeave, myLeaves, reviewLeaves, approveReject
} = require('../controllers/leaveController');

router.use(auth);

router.post('/', rbac('staff'), asyncHandler(submitLeave));
router.get('/my', rbac('staff'), asyncHandler(myLeaves));
router.get('/review', rbac('manager', 'admin'), asyncHandler(reviewLeaves));
router.patch('/:id/review', rbac('manager', 'admin'), asyncHandler(approveReject));

module.exports = router;
