const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { getSettings, updateSettings } = require('../controllers/settingController');

router.use(auth, rbac('admin'));

router.get('/', asyncHandler(getSettings));
router.put('/', asyncHandler(updateSettings));

module.exports = router;
