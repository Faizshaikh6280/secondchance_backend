const cron = require('node-cron');
const Challenge = require('../models/Challenge');

function startChallengeCron() {
  // Run daily at 00:10 AM
  cron.schedule('10 0 * * *', async () => {
    console.log('[Challenge Cron] Updating challenge statuses...');

    try {
      const now = new Date();

      // upcoming → active (startDate has passed)
      const activated = await Challenge.updateMany(
        { status: 'upcoming', startDate: { $lte: now } },
        { $set: { status: 'active' } },
      );

      // active → completed (endDate has passed)
      const completed = await Challenge.updateMany(
        { status: 'active', endDate: { $lte: now } },
        { $set: { status: 'completed' } },
      );

      console.log(`[Challenge Cron] ${activated.modifiedCount} activated, ${completed.modifiedCount} completed`);
    } catch (err) {
      console.log(`[Challenge Cron] Error: ${err.message}`);
    }
  });

  console.log('[Challenge Cron] Scheduled daily at 00:10');
}

module.exports = { startChallengeCron };
