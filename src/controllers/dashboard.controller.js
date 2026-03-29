const RecoveryProgress = require('../models/RecoveryProgress');
const asyncHandler = require('../utils/asyncHandler');
const { REWARDS, INITIAL_DAILY_TASKS } = require('../utils/constants');
const { awardProgress } = require('../services/gamification');
const { updateStreak } = require('../services/streak');

function computeBodyHealing(daysSober, addictionType) {
  const lungRate = addictionType === 'smoking' ? 0.5 : 0.2;
  return {
    lungs: Math.min(Math.round(daysSober * lungRate), 100),
    heart: Math.min(Math.round(daysSober * 0.3), 100),
    bloodPressure: Math.min(Math.round(daysSober * 0.5), 100),
    moneySaved: Math.round(daysSober * (addictionType === 'alcohol' ? 8 : addictionType === 'smoking' ? 5 : 3)),
  };
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

exports.getToday = asyncHandler(async (req, res) => {
  const user = req.user;
  console.log('[Dashboard API] GET /dashboard/today — user:', user.email || user._id);
  updateStreak(user);
  await user.save();

  const daysSober = Math.max(1, Math.floor((Date.now() - new Date(user.recoveryStartDate).getTime()) / 86400000));
  const bodyHealing = computeBodyHealing(daysSober, user.onboarding.type);

  let progress = await RecoveryProgress.findOne({ userId: user._id });
  if (!progress) {
    progress = await RecoveryProgress.create({ userId: user._id, journey: [], dailyTasks: [], cravingLog: [], moodLog: [] });
  }

  // Update body healing
  progress.bodyHealing = bodyHealing;
  await progress.save();

  // Get or create today's tasks — pull from journey's active day if available
  const todayKey = getTodayKey();
  let todayEntry = progress.dailyTasks.find(d => d.date?.toISOString().split('T')[0] === todayKey);
  if (!todayEntry) {
    // Try to get tasks from the journey's current active day
    let tasksForToday = null;
    if (progress.journey?.length) {
      for (const week of progress.journey) {
        const activeDay = week.days?.find(d => d.status === 'active');
        if (activeDay?.tasks?.length) {
          tasksForToday = activeDay.tasks.map(t => ({
            taskId: t.taskId,
            title: t.title,
            time: t.time,
            completed: false,
          }));
          console.log('[Dashboard API] Using journey active day tasks (Day', activeDay.dayNum, '):', tasksForToday.map(t => t.title));
          break;
        }
      }
    }

    if (!tasksForToday) {
      console.log('[Dashboard API] No journey active day found, using INITIAL_DAILY_TASKS fallback');
      tasksForToday = INITIAL_DAILY_TASKS.map(t => ({ ...t, completed: false }));
    }

    todayEntry = { date: new Date(todayKey), tasks: tasksForToday };
    progress.dailyTasks.push(todayEntry);
    await progress.save();
    todayEntry = progress.dailyTasks[progress.dailyTasks.length - 1];
  } else {
    // Sync: if journey has an active day with different tasks, update dailyTasks
    let journeyTasks = null;
    if (progress.journey?.length) {
      for (const week of progress.journey) {
        const activeDay = week.days?.find(d => d.status === 'active');
        if (activeDay?.tasks?.length) {
          journeyTasks = activeDay.tasks;
          break;
        }
      }
    }

    if (journeyTasks) {
      const currentIds = todayEntry.tasks.map(t => t.taskId).sort().join(',');
      const journeyIds = journeyTasks.map(t => t.taskId).sort().join(',');
      if (currentIds !== journeyIds) {
        // Build a map of existing completion status
        const completionMap = {};
        todayEntry.tasks.forEach(t => { completionMap[t.taskId] = t.completed; });
        // Replace with journey tasks, preserving completion for matching taskIds
        todayEntry.tasks = journeyTasks.map(t => ({
          taskId: t.taskId,
          title: t.title,
          time: t.time,
          completed: completionMap[t.taskId] || false,
        }));
        await progress.save();
        console.log('[Dashboard API] Synced dailyTasks with journey active day:', todayEntry.tasks.map(t => t.title));
      }
    }
  }

  const todayStart = new Date(todayKey);
  const checkedInToday = progress.cravingLog.some(c => c.date >= todayStart);

  console.log('[Dashboard API] Returning tasks:', todayEntry.tasks.map(t => ({ id: t.taskId, title: t.title, completed: t.completed })));
  console.log('[Dashboard API] daysSober:', daysSober, '| streak:', user.gamification.streakDays, '| bodyHealing:', bodyHealing);

  res.json({
    streakDays: user.gamification.streakDays,
    bodyHealing,
    tasks: todayEntry.tasks,
    xp: user.gamification.xp,
    gems: user.gamification.gems,
    daysSober,
    checkedInToday,
  });
});

exports.toggleTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const progress = await RecoveryProgress.findOne({ userId: req.user._id });
  if (!progress) return res.status(404).json({ error: 'No progress found' });

  const todayKey = getTodayKey();
  const todayEntry = progress.dailyTasks.find(d => d.date?.toISOString().split('T')[0] === todayKey);
  if (!todayEntry) return res.status(404).json({ error: 'No tasks for today' });

  const task = todayEntry.tasks.find(t => t.taskId === taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  task.completed = !task.completed;
  await progress.save();

  if (task.completed) {
    await awardProgress(req.user._id, {
      actionKey: `dashboard-task-${taskId}-${todayKey}`,
      xp: REWARDS.DASHBOARD_TASK.xp,
      gems: REWARDS.DASHBOARD_TASK.gems,
      updates: { activitiesCompleted: 1 },
    });
  }

  const updatedUser = await req.user.constructor.findById(req.user._id);
  res.json({ task, gamification: updatedUser.gamification });
});

exports.logCraving = asyncHandler(async (req, res) => {
  const { intensity } = req.body;
  if (intensity === undefined) return res.status(400).json({ error: 'intensity required' });

  let progress = await RecoveryProgress.findOne({ userId: req.user._id });
  if (!progress) {
    progress = await RecoveryProgress.create({ userId: req.user._id, journey: [], dailyTasks: [], cravingLog: [], moodLog: [] });
  }

  progress.cravingLog.push({ date: new Date(), intensity });
  // Keep last 30 entries
  if (progress.cravingLog.length > 30) progress.cravingLog = progress.cravingLog.slice(-30);
  await progress.save();

  res.json({ success: true });
});

exports.logMood = asyncHandler(async (req, res) => {
  const { mood } = req.body;
  if (mood === undefined) return res.status(400).json({ error: 'mood required' });

  let progress = await RecoveryProgress.findOne({ userId: req.user._id });
  if (!progress) {
    progress = await RecoveryProgress.create({ userId: req.user._id, journey: [], dailyTasks: [], cravingLog: [], moodLog: [] });
  }

  progress.moodLog.push({ date: new Date(), mood });
  if (progress.moodLog.length > 30) progress.moodLog = progress.moodLog.slice(-30);
  await progress.save();

  res.json({ success: true });
});

exports.getCharts = asyncHandler(async (req, res) => {
  const progress = await RecoveryProgress.findOne({ userId: req.user._id });
  if (!progress) return res.json({ cravingData: [], moodData: [] });

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const cravingData = progress.cravingLog.slice(-7).map(c => ({
    day: dayNames[new Date(c.date).getDay()],
    intensity: c.intensity,
  }));

  const moodData = progress.moodLog.slice(-7).map(m => ({
    day: dayNames[new Date(m.date).getDay()],
    mood: m.mood,
  }));

  res.json({ cravingData, moodData });
});
