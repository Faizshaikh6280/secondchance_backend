const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/recovery.controller');

router.get('/journey', auth, c.getJourney);
router.post('/journey/day/:dayId/task/:taskId', auth, c.toggleJourneyTask);
router.post('/journey/day/:dayId/complete', auth, c.completeDay);
router.get('/plan', auth, c.getPlan);
router.post('/plan/refresh', auth, c.refreshPlan);

module.exports = router;
