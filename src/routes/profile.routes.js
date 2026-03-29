const router = require('express').Router();
const auth = require('../middleware/auth');
const { getProfile, saveOnboarding, saveExtendedProfile, awardReward } = require('../controllers/profile.controller');

router.get('/', auth, getProfile);
router.put('/onboarding', auth, saveOnboarding);
router.put('/extended', auth, saveExtendedProfile);
router.post('/reward', auth, awardReward);

module.exports = router;
