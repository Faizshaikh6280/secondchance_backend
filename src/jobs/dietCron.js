const cron = require('node-cron');
const User = require('../models/User');
const { generateDietForUser } = require('../controllers/diet.controller');

function startDietCron() {
  // Run daily at 00:05 AM
  cron.schedule('5 0 * * *', async () => {
    console.log('[Diet Cron] Starting daily diet plan generation...');

    try {
      const users = await User.find({
        role: 'user',
        'onboarding.completed': true,
      });

      let success = 0;
      let failed = 0;

      for (const user of users) {
        try {
          await generateDietForUser(user);
          success++;
        } catch (err) {
          failed++;
          console.log(`[Diet Cron] Failed for ${user.email}: ${err.message}`);
        }
      }

      console.log(`[Diet Cron] Done — ${success} generated, ${failed} failed`);
    } catch (err) {
      console.log(`[Diet Cron] Error: ${err.message}`);
    }
  });

  console.log('[Diet Cron] Scheduled daily at 00:05');
}

module.exports = { startDietCron };
