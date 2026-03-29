const router = require('express').Router();
const auth = require('../middleware/auth');
const { getDashboard, getNotifications, markNotificationRead } = require('../controllers/acquaintance.controller');

router.get('/dashboard', auth, getDashboard);
router.get('/notifications', auth, getNotifications);
router.put('/notifications/:id/read', auth, markNotificationRead);

module.exports = router;
