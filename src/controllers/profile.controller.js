const User = require('../models/User');
const RecoveryProgress = require('../models/RecoveryProgress');
const asyncHandler = require('../utils/asyncHandler');
const { INITIAL_JOURNEY } = require('../utils/constants');
const { createAcquaintanceAccounts } = require('../services/acquaintance.service');

exports.getProfile = asyncHandler(async (req, res) => {
  const user = req.user.toObject();
  delete user.passwordHash;
  res.json({ user });
});

exports.saveOnboarding = asyncHandler(async (req, res) => {
  const { type, duration, cravingTime, trigger, motivation, anchorImages, emergencyContacts } = req.body;

  const user = req.user;
  user.onboarding = {
    completed: true,
    type: type || user.onboarding.type,
    duration: duration || user.onboarding.duration,
    cravingTime: cravingTime || user.onboarding.cravingTime,
    trigger: trigger || user.onboarding.trigger,
    motivation: motivation || user.onboarding.motivation,
    anchorImages: anchorImages || user.onboarding.anchorImages,
    emergencyContacts: emergencyContacts || user.onboarding.emergencyContacts,
  };
  user.recoveryStartDate = new Date();
  await user.save();

  // Create initial recovery progress
  await RecoveryProgress.findOneAndUpdate(
    { userId: user._id },
    {
      userId: user._id,
      journey: INITIAL_JOURNEY,
      dailyTasks: [],
      cravingLog: [],
      moodLog: [],
      bodyHealing: { lungs: 0, heart: 0, bloodPressure: 0, moneySaved: 0 },
    },
    { upsert: true, new: true }
  );

  // Create acquaintance accounts for contacts with emails (non-blocking)
  if (emergencyContacts?.length) {
    createAcquaintanceAccounts(user, emergencyContacts).catch(err => {
      console.log('[Onboarding] Acquaintance creation failed:', err.message);
    });
  }

  const result = user.toObject();
  delete result.passwordHash;
  res.json({ user: result });
});

exports.saveExtendedProfile = asyncHandler(async (req, res) => {
  const user = req.user;
  const fields = ['age', 'gender', 'sex', 'heightCm', 'weightKg', 'educationLevel',
    'employmentStatus', 'incomeBracket', 'activityLevel', 'regionCountry', 'dietType', 'budgetLevel'];

  for (const f of fields) {
    if (req.body[f] !== undefined) {
      user.extendedProfile[f] = req.body[f];
    }
  }
  await user.save();

  const result = user.toObject();
  delete result.passwordHash;
  res.json({ user: result });
});

exports.awardReward = asyncHandler(async (req, res) => {
  const { actionKey, xp = 0, gems = 0, updates = {} } = req.body;
  if (!actionKey) {
    return res.status(400).json({ error: 'actionKey is required' });
  }

  const user = req.user;

  // Idempotency check
  if (user.gamification.rewardedActions.get(actionKey)) {
    return res.json({ awarded: false, gamification: user.gamification });
  }

  user.gamification.xp += xp;
  user.gamification.gems += gems;
  user.gamification.completedChallenges += (updates.completedChallenges || 0);
  user.gamification.stats.activitiesCompleted += (updates.activitiesCompleted || 0);
  user.gamification.stats.dietPlansFollowed += (updates.dietPlansFollowed || 0);
  user.gamification.stats.challengeMilestonesCompleted += (updates.challengeMilestonesCompleted || 0);
  user.gamification.rewardedActions.set(actionKey, true);

  await user.save();
  res.json({ awarded: true, gamification: user.gamification });
});
