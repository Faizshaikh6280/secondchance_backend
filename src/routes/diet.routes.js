const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/diet.controller');

router.get('/today', auth, c.getToday);
router.post('/meal/:mealId/toggle', auth, c.toggleMeal);
router.post('/refresh', auth, c.refresh);

module.exports = router;
