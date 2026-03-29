const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/dashboard.controller');

router.get('/today', auth, c.getToday);
router.post('/task/:taskId/toggle', auth, c.toggleTask);
router.post('/craving', auth, c.logCraving);
router.post('/mood', auth, c.logMood);
router.get('/charts', auth, c.getCharts);

module.exports = router;
