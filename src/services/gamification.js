const User = require('../models/User');

async function awardProgress(userId, { actionKey, xp = 0, gems = 0, updates = {} }) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  if (user.gamification.rewardedActions.get(actionKey)) {
    return { awarded: false, gamification: user.gamification };
  }

  user.gamification.xp += xp;
  user.gamification.gems += gems;
  user.gamification.completedChallenges += (updates.completedChallenges || 0);
  user.gamification.stats.activitiesCompleted += (updates.activitiesCompleted || 0);
  user.gamification.stats.dietPlansFollowed += (updates.dietPlansFollowed || 0);
  user.gamification.stats.challengeMilestonesCompleted += (updates.challengeMilestonesCompleted || 0);
  user.gamification.rewardedActions.set(actionKey, true);

  await user.save();
  return { awarded: true, gamification: user.gamification };
}

module.exports = { awardProgress };
