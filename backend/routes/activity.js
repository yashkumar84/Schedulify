const express = require('express');
const router = express.Router();
const { getActivities } = require('../controllers/ActivityController');
const { authenticate } = require('../helpers/auth');

router.get('/', authenticate, getActivities);

module.exports = router;
