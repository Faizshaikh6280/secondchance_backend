const REWARDS = {
  DASHBOARD_TASK: { xp: 60, gems: 4 },
  RECOVERY_DAY: { xp: 120, gems: 8 },
  DIET_MEAL: { xp: 90, gems: 6 },
  CHALLENGE_JOIN: { xp: 50, gems: 5 },
  CHALLENGE_COMPLETE: { xp: 180, gems: 18 },
};

const INITIAL_DAILY_TASKS = [
  { taskId: '1', title: '3 minute breathing', time: 'Morning' },
  { taskId: '2', title: '10 minute walk', time: 'Afternoon' },
  { taskId: '3', title: 'Journal reflection', time: 'Evening' },
  { taskId: '4', title: 'Craving prevention', time: 'Night' },
];

const INITIAL_JOURNEY = [
  {
    weekNum: 1,
    title: 'Week 1 - Building Foundation',
    days: Array.from({ length: 7 }, (_, i) => ({
      dayNum: i + 1,
      status: i === 0 ? 'active' : 'locked',
      tasks: [
        { taskId: `w1d${i + 1}t1`, title: 'Morning breathing exercise', time: 'Morning', done: false },
        { taskId: `w1d${i + 1}t2`, title: 'Afternoon walk or hydration', time: 'Afternoon', done: false },
        { taskId: `w1d${i + 1}t3`, title: 'Evening journal or recovery stories', time: 'Evening', done: false },
        { taskId: `w1d${i + 1}t4`, title: 'Craving prevention or sleep hygiene', time: 'Night', done: false },
      ],
      completedAt: null,
    })),
  },
  {
    weekNum: 2,
    title: 'Week 2 - Strengthening Habits',
    days: Array.from({ length: 7 }, (_, i) => ({
      dayNum: i + 1,
      status: 'locked',
      tasks: [
        { taskId: `w2d${i + 1}t1`, title: 'Morning breathing exercise', time: 'Morning', done: false },
        { taskId: `w2d${i + 1}t2`, title: 'Afternoon walk or hydration', time: 'Afternoon', done: false },
        { taskId: `w2d${i + 1}t3`, title: 'Evening journal or recovery stories', time: 'Evening', done: false },
        { taskId: `w2d${i + 1}t4`, title: 'Craving prevention or sleep hygiene', time: 'Night', done: false },
      ],
      completedAt: null,
    })),
  },
];

module.exports = { REWARDS, INITIAL_DAILY_TASKS, INITIAL_JOURNEY };
