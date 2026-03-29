const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/challenge.controller');

router.get('/', auth, c.list);
router.get('/leaderboard/global', auth, c.globalLeaderboard);
router.get('/:id', auth, c.getById);
router.post('/:id/join', auth, c.join);
router.post('/:id/task/:taskId/toggle', auth, c.toggleTask);

module.exports = router;
