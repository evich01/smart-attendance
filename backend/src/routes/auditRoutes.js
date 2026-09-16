const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { listAuditLogs } = require('../controllers/auditController');

router.use(auth, rbac('admin'));
router.get('/', asyncHandler(listAuditLogs));

module.exports = router;
