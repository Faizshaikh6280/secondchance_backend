const Challenge = require('../models/Challenge');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { REWARDS } = require('../utils/constants');
const { awardProgress } = require('../services/gamification');

exports.list = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const challenges = await Challenge.find(filter).lean();

  // Add user-specific data
  const userId = req.user._id.toString();

  // Collect participant userIds from completed challenges to look up names
  const completedParticipantIds = new Set();
  challenges.forEach(c => {
    if (c.status === 'completed' && c.participants?.length) {
      c.participants.forEach(p => { if (p.userId) completedParticipantIds.add(p.userId.toString()); });
    }
  });
  const nameMap = new Map();
  if (completedParticipantIds.size > 0) {
    const users = await User.find({ _id: { $in: [...completedParticipantIds] } }).select('name').lean();
    users.forEach(u => nameMap.set(u._id.toString(), u.name));
  }

  const enriched = challenges.map(c => {
    const participant = c.participants?.find(p => p.userId?.toString() === userId);
    const base = {
      ...c,
      joined: !!participant,
      myPoints: participant?.myPoints || 0,
      myCompletedTasks: participant?.completedTasks || [],
    };
    if (c.status === 'completed' && c.participants?.length) {
      base.leaderboard = [...c.participants]
        .sort((a, b) => (b.myPoints || 0) - (a.myPoints || 0))
        .slice(0, 10)
        .map((p, i) => ({
          rank: i + 1,
          name: nameMap.get(p.userId?.toString()) || 'User',
          score: p.myPoints || 0,
          country: '\u{1F30D}',
          isMe: p.userId?.toString() === userId,
        }));
    }
    return base;
  });

  res.json({ challenges: enriched });
});

exports.getById = asyncHandler(async (req, res) => {
  const challenge = await Challenge.findById(req.params.id).lean();
  if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

  const userId = req.user._id.toString();
  const participant = challenge.participants?.find(p => p.userId?.toString() === userId);

  res.json({
    challenge: {
      ...challenge,
      joined: !!participant,
      myPoints: participant?.myPoints || 0,
      myCompletedTasks: participant?.completedTasks || [],
    },
  });
});

exports.join = asyncHandler(async (req, res) => {
  const challenge = await Challenge.findById(req.params.id);
  if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

  const userId = req.user._id;
  const alreadyJoined = challenge.participants.some(p => p.userId?.toString() === userId.toString());
  if (alreadyJoined) return res.status(400).json({ error: 'Already joined' });

  challenge.participants.push({ userId, joinedAt: new Date(), myPoints: 0, completedTasks: [] });
  challenge.participantCount += 1;
  await challenge.save();

  await awardProgress(userId, {
    actionKey: `challenge-join-${challenge._id}`,
    xp: REWARDS.CHALLENGE_JOIN.xp,
    gems: REWARDS.CHALLENGE_JOIN.gems,
    updates: { challengeMilestonesCompleted: 1 },
  });

  const updatedUser = await User.findById(userId);
  res.json({ joined: true, participantCount: challenge.participantCount, gamification: updatedUser.gamification });
});

exports.toggleTask = asyncHandler(async (req, res) => {
  const { id, taskId } = req.params;
  const challenge = await Challenge.findById(id);
  if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

  const userId = req.user._id.toString();
  const participant = challenge.participants.find(p => p.userId?.toString() === userId);
  if (!participant) return res.status(400).json({ error: 'Not joined' });

  const task = challenge.tasks.find(t => t.taskId === taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const alreadyDone = participant.completedTasks.includes(taskId);
  if (alreadyDone) {
    participant.completedTasks = participant.completedTasks.filter(t => t !== taskId);
    participant.myPoints -= task.points;
  } else {
    participant.completedTasks.push(taskId);
    participant.myPoints += task.points;

    await awardProgress(req.user._id, {
      actionKey: `challenge-task-${id}-${taskId}`,
      xp: task.points,
      gems: Math.max(4, Math.round(task.points / 40)),
      updates: { challengeMilestonesCompleted: 1 },
    });

    // Check if all tasks complete
    if (participant.completedTasks.length === challenge.tasks.length) {
      await awardProgress(req.user._id, {
        actionKey: `challenge-complete-${id}`,
        xp: REWARDS.CHALLENGE_COMPLETE.xp,
        gems: REWARDS.CHALLENGE_COMPLETE.gems,
        updates: { completedChallenges: 1 },
      });
    }
  }

  await challenge.save();
  const updatedUser = await User.findById(req.user._id);

  res.json({
    myPoints: participant.myPoints,
    myCompletedTasks: participant.completedTasks,
    gamification: updatedUser.gamification,
  });
});

exports.globalLeaderboard = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id.toString();
  const users = await User.find({ role: { $ne: 'acquaintance' } })
    .sort({ 'gamification.xp': -1 })
    .limit(50)
    .select('name gamification.xp extendedProfile.regionCountry')
    .lean();

  const COUNTRY_FLAGS = { India: '\u{1F1EE}\u{1F1F3}', USA: '\u{1F1FA}\u{1F1F8}', UK: '\u{1F1EC}\u{1F1E7}', Canada: '\u{1F1E8}\u{1F1E6}', Australia: '\u{1F1E6}\u{1F1FA}' };

  const leaderboard = users.map((u, i) => ({
    rank: i + 1,
    name: u.name,
    score: u.gamification?.xp || 0,
    country: COUNTRY_FLAGS[u.extendedProfile?.regionCountry] || '\u{1F30D}',
    isMe: u._id.toString() === currentUserId,
  }));

  const userRank = leaderboard.findIndex(l => l.isMe) + 1;

  res.json({
    leaderboard: leaderboard.slice(0, 10),
    userRank: userRank || leaderboard.length + 1,
    userScore: req.user.gamification.xp,
  });
});
