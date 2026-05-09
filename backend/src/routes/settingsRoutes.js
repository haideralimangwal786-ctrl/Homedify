const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
    .get(settingsController.getSettings)
    .put(protect, authorize('admin'), settingsController.updateSettings);

module.exports = router;
