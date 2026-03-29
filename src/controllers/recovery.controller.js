const RecoveryProgress = require('../models/RecoveryProgress');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { REWARDS, INITIAL_JOURNEY } = require('../utils/constants');
const { awardProgress } = require('../services/gamification');
const { buildRecoveryParams } = require('../services/paramMapper');
const mlService = require('../services/ml.service');

const TIME_OF_DAY_LABELS = ['Morning', 'Afternoon', 'Evening', 'Night'];

// Map ML weekly_recovery_plan → journey structure
function mapMlPlanToJourney(mlPlan, weekNum, existingDays) {
  const days = mlPlan.weekly_recovery_plan?.days || [];
  return {
    weekNum,
    title: mlPlan.weekly_recovery_plan?.plan_name || `Week ${weekNum} - Recovery Plan`,
    days: days.map((mlDay, di) => {
      const existing = existingDays?.[di];
      const status = existing?.status || (di === 0 ? 'active' : 'locked');
      return {
        dayNum: (weekNum - 1) * 7 + di + 1,
        status,
        tasks: (mlDay.activities || []).map((act, ti) => ({
          taskId: `w${weekNum}d${di + 1}t${ti + 1}`,
          title: `${act.activity_name} (${act.duration_minutes} min)`,
          time: TIME_OF_DAY_LABELS[ti % TIME_OF_DAY_LABELS.length],
          done: existing?.tasks?.[ti]?.done || false,
        })),
        completedAt: existing?.completedAt || null,
      };
    }),
  };
}

// Shared: generate ML recovery plan and map to journey for a user
async function generateRecoveryForUser(user) {
  const params = buildRecoveryParams(user);
  console.log('[Recovery API] REQUEST to ML service:', JSON.stringify(params, null, 2));
  const mlPlan = await mlService.predictRecoveryPlan(params);
  console.log('[Recovery API] RESPONSE from ML — confidence:', mlPlan?.confidence_score,
    ', days:', mlPlan?.weekly_recovery_plan?.days?.length,
    ', activities per day:', mlPlan?.weekly_recovery_plan?.days?.map(d => d.activities?.length));
  return mlPlan;
}

exports.generateRecoveryForUser = generateRecoveryForUser;
exports.mapMlPlanToJourney = mapMlPlanToJourney;

exports.getJourney = asyncHandler(async (req, res) => {
  console.log('[Recovery API] GET /recovery/journey — user:', req.user.email || req.user._id);
  let progress = await RecoveryProgress.findOne({ userId: req.user._id });

  if (!progress) {
    progress = await RecoveryProgress.create({
      userId: req.user._id,
      journey: [],
      dailyTasks: [], cravingLog: [], moodLog: [],
    });
  }

  // If no ML plan stored yet, generate one
  if (!progress.mlRecoveryPlan) {
    try {
      const mlPlan = await generateRecoveryForUser(req.user);
      const week1 = mapMlPlanToJourney(mlPlan, 1, null);
      progress.journey = [week1];
      progress.mlRecoveryPlan = mlPlan;
      await progress.save();
      console.log('[Recovery API] Generated ML journey — days:', week1.days.map(d => ({
        day: d.dayNum, status: d.status, tasks: d.tasks.map(t => t.title)
      })));
    } catch (err) {
      console.log('[Recovery API] ML service unavailable, using INITIAL_JOURNEY fallback. Error:', err.message);
      if (!progress.journey || progress.journey.length === 0) {
        progress.journey = INITIAL_JOURNEY;
        await progress.save();
      }
    }
  }

  // Safety: if journey is still empty, use fallback
  if (!progress.journey || progress.journey.length === 0) {
    progress.journey = INITIAL_JOURNEY;
    await progress.save();
  }

  res.json({ journey: progress.journey });
});

exports.toggleJourneyTask = asyncHandler(async (req, res) => {
  const { dayId, taskId } = req.params;
  const progress = await RecoveryProgress.findOne({ userId: req.user._id });
  if (!progress) return res.status(404).json({ error: 'No progress found' });

  let found = false;
  for (const week of progress.journey) {
    for (const day of week.days) {
      if (String(day.dayNum) === dayId || day._id?.toString() === dayId) {
        const task = day.tasks.find(t => t.taskId === taskId || t._id?.toString() === taskId);
        if (task) {
          task.done = !task.done;
          found = true;
          break;
        }
      }
    }
    if (found) break;
  }

  if (!found) return res.status(404).json({ error: 'Task not found' });
  await progress.save();
  res.json({ journey: progress.journey });
});

exports.completeDay = asyncHandler(async (req, res) => {
  const { dayId } = req.params;
  const progress = await RecoveryProgress.findOne({ userId: req.user._id });
  if (!progress) return res.status(404).json({ error: 'No progress found' });

  let completedDay = null;

  for (let wi = 0; wi < progress.journey.length; wi++) {
    const week = progress.journey[wi];
    for (let di = 0; di < week.days.length; di++) {
      const day = week.days[di];
      if (String(day.dayNum) === dayId || day._id?.toString() === dayId) {
        day.status = 'completed';
        day.completedAt = new Date();
        completedDay = day;

        // Unlock next day
        if (di + 1 < week.days.length) {
          week.days[di + 1].status = 'active';
        } else if (wi + 1 < progress.journey.length) {
          progress.journey[wi + 1].days[0].status = 'active';
        }
        break;
      }
    }
    if (completedDay) break;
  }

  if (!completedDay) return res.status(404).json({ error: 'Day not found' });

  await progress.save();

  const weekNum = progress.journey.findIndex(w => w.days.some(d => d === completedDay)) + 1;
  await awardProgress(req.user._id, {
    actionKey: `recovery-day-w${weekNum}d${dayId}`,
    xp: REWARDS.RECOVERY_DAY.xp,
    gems: REWARDS.RECOVERY_DAY.gems,
    updates: { activitiesCompleted: 1 },
  });

  const updatedUser = await User.findById(req.user._id);
  res.json({ journey: progress.journey, gamification: updatedUser.gamification });
});

exports.getPlan = asyncHandler(async (req, res) => {
  const user = req.user;
  console.log('[Recovery API] GET /recovery/plan — user:', user.email || user._id);
  if (user.mlCache.recoveryPlan) {
    console.log('[Recovery API] Returning CACHED plan (lastUpdated:', user.mlCache.lastUpdated, ')');
    return res.json({ plan: user.mlCache.recoveryPlan, cached: true });
  }

  try {
    const mlPlan = await generateRecoveryForUser(user);
    user.mlCache.recoveryPlan = mlPlan;
    user.mlCache.lastUpdated = new Date();
    await user.save();
    res.json({ plan: mlPlan, cached: false });
  } catch (err) {
    console.log('[Recovery API] ML service unavailable. Error:', err.message);
    res.json({ plan: null, error: 'ML service unavailable', cached: false });
  }
});

exports.refreshPlan = asyncHandler(async (req, res) => {
  const user = req.user;
  console.log('[Recovery API] POST /recovery/plan/refresh — user:', user.email || user._id);
  try {
    const mlPlan = await generateRecoveryForUser(user);

    // Update ML cache on user
    user.mlCache.recoveryPlan = mlPlan;
    user.mlCache.lastUpdated = new Date();
    await user.save();

    // Also update journey with new ML plan, preserving day statuses
    let progress = await RecoveryProgress.findOne({ userId: user._id });
    if (progress) {
      const existingDays = progress.journey?.[0]?.days;
      const week1 = mapMlPlanToJourney(mlPlan, 1, existingDays);
      progress.journey = [week1];
      progress.mlRecoveryPlan = mlPlan;
      await progress.save();
      console.log('[Recovery API] REFRESH — updated journey with new ML plan');
    }

    res.json({ plan: mlPlan, cached: false });
  } catch (err) {
    console.log('[Recovery API] REFRESH failed. Error:', err.message);
    res.status(503).json({ error: 'ML service unavailable' });
  }
});
