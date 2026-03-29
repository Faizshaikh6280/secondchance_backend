const CopingSession = require('../models/CopingSession');
const RecoveryProgress = require('../models/RecoveryProgress');
const User = require('../models/User');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { buildCopingParams } = require('../services/paramMapper');
const mlService = require('../services/ml.service');
const { sendCopingNotification } = require('../services/email.service');

const MOOD_MAP = { very_low: 1, low: 2, anxious: 2, neutral: 3, good: 4, very_good: 4 };

exports.startSession = asyncHandler(async (req, res) => {
  const { cravingLevel, mood, trigger } = req.body;
  const user = req.user;
  console.log('[Coping API] POST /coping/session/start — user:', user.email || user._id, '| cravingLevel:', cravingLevel, '| mood:', mood, '| trigger:', trigger);

  let mlResponse = null;
  try {
    const params = buildCopingParams(user, { cravingLevel, mood });
    console.log('[Coping API] REQUEST to ML service:', JSON.stringify(params, null, 2));
    mlResponse = await mlService.predictCoping(params);
    console.log('[Coping API] RESPONSE from ML — risk:', mlResponse?.risk_score, '| risk_cat:', mlResponse?.risk_category,
      '| relapse_prob:', mlResponse?.relapse_probability, '| stage3_technique:', mlResponse?.stage3_mental_stabilization?.technique,
      '| stage4_strategy:', mlResponse?.stage4_craving_management?.strategy, '| next_craving:', mlResponse?.predicted_next_craving_time);
  } catch (err) {
    console.log('[Coping API] ML coping service unavailable, using DEFAULTS. Error:', err.message);
    mlResponse = {
      risk_score: 0.5,
      risk_category: 'medium',
      relapse_probability: 0.3,
      stage1_emotional_trigger: {
        type: 'family_emotional_trigger',
        video_url: 'https://youtube.com/shorts/-ch4NqzdhA8',
        message: 'Your family is waiting for you. Stay strong.',
      },
      stage2_motivation: {
        type: 'motivation_video',
        video_url: 'https://youtube.com/shorts/-m_sgiO0fHM',
        message: 'You have already taken the hardest step.',
      },
      stage3_mental_stabilization: {
        technique: 'breathing',
        duration_minutes: 3,
        audio_url: '',
        instructions: 'Inhale slowly for 4 seconds, hold for 4, exhale for 6.',
      },
      stage4_craving_management: {
        strategy: 'drink_water',
        delay_timer_minutes: 10,
        description: 'Drink a glass of cold water slowly.',
        instructions: ['Get a glass of cold water', 'Drink slowly for 2 minutes', 'Focus on the sensation'],
      },
    };
  }

  // Deduplication: if user already started a session in the last 2 minutes, return it
  const recentSession = await CopingSession.findOne({
    userId: user._id,
    createdAt: { $gte: new Date(Date.now() - 2 * 60 * 1000) },
  }).sort({ createdAt: -1 });

  if (recentSession) {
    console.log('[Coping API] Returning recent session (dedup):', recentSession._id);
    return res.json({ sessionId: recentSession._id, ...recentSession.mlResponse });
  }

  const session = await CopingSession.create({
    userId: user._id,
    cravingLevel,
    mood,
    trigger,
    mlResponse,
  });

  // Fire-and-forget: feed dashboard craving/mood charts
  RecoveryProgress.findOneAndUpdate(
    { userId: user._id },
    {
      $push: {
        cravingLog: { $each: [{ date: new Date(), intensity: cravingLevel || 7 }], $slice: -30 },
        moodLog: { $each: [{ date: new Date(), mood: MOOD_MAP[mood] || 3 }], $slice: -30 },
      },
    },
    { upsert: true }
  ).catch(() => {});

  // Notify acquaintances (non-blocking)
  User.find({ linkedUserId: user._id, role: 'acquaintance' }).then(async (acquaintances) => {
    for (const acq of acquaintances) {
      try {
        await Notification.create({
          recipientId: acq._id,
          senderId: user._id,
          type: 'coping_session',
          message: `${user.name} is currently using the Coping Now feature and may need support.`,
          metadata: { sessionId: session._id, cravingLevel },
        });
        sendCopingNotification(acq.email, { addictName: user.name }).catch(err => console.error('[Coping API] Email to', acq.email, 'failed:', err.message));
      } catch (err) {
        console.log(`[Coping] Failed to notify ${acq.email}:`, err.message);
      }
    }
  }).catch(() => {});

  console.log('[Coping API] Session created:', session._id, '| Returning ML response to frontend');
  res.json({ sessionId: session._id, ...mlResponse });
});

exports.updateProgress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { stepsCompleted } = req.body;

  const session = await CopingSession.findOneAndUpdate(
    { _id: id, userId: req.user._id },
    { stepsCompleted },
    { new: true }
  );

  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json({ session });
});

exports.completeSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cravingAfter, helpful } = req.body;

  const session = await CopingSession.findOneAndUpdate(
    { _id: id, userId: req.user._id },
    { completedAt: new Date(), stepsCompleted: 7, outcome: { cravingAfter, helpful } },
    { new: true }
  );

  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json({ session });
});

exports.getSessions = asyncHandler(async (req, res) => {
  const sessions = await CopingSession.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  res.json({ sessions });
});
