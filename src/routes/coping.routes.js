const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/coping.controller');

router.post('/session/start', auth, c.startSession);
router.put('/session/:id/progress', auth, c.updateProgress);
router.put('/session/:id/complete', auth, c.completeSession);
router.get('/sessions', auth, c.getSessions);

module.exports = router;
