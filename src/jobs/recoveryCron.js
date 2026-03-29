const cron = require('node-cron');
const User = require('../models/User');
const RecoveryProgress = require('../models/RecoveryProgress');
const { generateRecoveryForUser, mapMlPlanToJourney } = require('../controllers/recovery.controller');

function startRecoveryCron() {
  // Run daily at 00:10 AM (after diet cron at 00:05)
  cron.schedule('10 0 * * *', async () => {
    console.log('[Recovery Cron] Starting daily recovery plan refresh...');

    try {
      const users = await User.find({
        role: 'user',
        'onboarding.completed': true,
      });

      let success = 0;
      let failed = 0;

      for (const user of users) {
        try {
          let progress = await RecoveryProgress.findOne({ userId: user._id });
          if (!progress) continue;

          // Regenerate ML plan and update journey
          const mlPlan = await generateRecoveryForUser(user);
          const existingDays = progress.journey?.[0]?.days;
          const week1 = mapMlPlanToJourney(mlPlan, 1, existingDays);
          progress.journey = [week1];
          progress.mlRecoveryPlan = mlPlan;

          // Clear today's daily tasks so dashboard picks up new journey tasks
          const todayKey = new Date().toISOString().split('T')[0];
          progress.dailyTasks = progress.dailyTasks.filter(
            d => d.date?.toISOString().split('T')[0] !== todayKey
          );

          await progress.save();
          success++;
        } catch (err) {
          failed++;
          console.log(`[Recovery Cron] Failed for ${user.email}: ${err.message}`);
        }
      }

      console.log(`[Recovery Cron] Done — ${success} refreshed, ${failed} failed`);
    } catch (err) {
      console.log(`[Recovery Cron] Error: ${err.message}`);
    }
  });

  console.log('[Recovery Cron] Scheduled daily at 00:10');
}

module.exports = { startRecoveryCron };
