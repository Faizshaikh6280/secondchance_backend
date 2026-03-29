const CommunityPost = require('../models/CommunityPost');
const Group = require('../models/Group');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { buildCommunityParams } = require('../services/paramMapper');
const mlService = require('../services/ml.service');

function logCommunityRiskResponse(prefix, risk) {
  console.log(
    `${prefix} risk_category:`,
    risk?.risk_category,
    '| relapse_probability:',
    risk?.relapse_probability,
    '| time_to_relapse_days_median:',
    risk?.time_to_relapse_days_median,
    '| emergency_flag:',
    risk?.emergency_flag,
    '| recommended_challenges:',
    risk?.recommended_challenges
  );
}

exports.getRisk = asyncHandler(async (req, res) => {
  const user = req.user;
  console.log('[Community API] GET /community/risk - user:', user.email || user._id);

  if (user.mlCache?.communityRisk) {
    console.log('[Community API] Returning CACHED risk (lastUpdated:', user.mlCache.lastUpdated, ')');
    logCommunityRiskResponse('[Community API] CACHED RESPONSE -', user.mlCache.communityRisk);
    return res.json({ risk: user.mlCache.communityRisk, cached: true });
  }

  try {
    const params = buildCommunityParams(user);
    console.log('[Community API] REQUEST to ML service:', JSON.stringify(params, null, 2));
    const risk = await mlService.predictCommunityRisk(params);
    logCommunityRiskResponse('[Community API] RESPONSE from ML -', risk);

    user.mlCache.communityRisk = risk;
    user.mlCache.lastUpdated = new Date();
    await user.save();

    res.json({ risk, cached: false });
  } catch (err) {
    console.log('[Community API] ML service unavailable. Error:', err.message);
    res.json({ risk: null, error: 'ML service unavailable', cached: false });
  }
});

exports.refreshRisk = asyncHandler(async (req, res) => {
  const user = req.user;
  console.log('[Community API] POST /community/risk/refresh - user:', user.email || user._id);

  try {
    const params = buildCommunityParams(user);
    console.log('[Community API] REFRESH REQUEST to ML service:', JSON.stringify(params, null, 2));
    const risk = await mlService.predictCommunityRisk(params);
    logCommunityRiskResponse('[Community API] REFRESH RESPONSE from ML -', risk);

    user.mlCache.communityRisk = risk;
    user.mlCache.lastUpdated = new Date();
    await user.save();

    res.json({ risk, cached: false });
  } catch (err) {
    console.log('[Community API] REFRESH failed. Error:', err.message);
    res.status(503).json({ error: 'ML service unavailable' });
  }
});

exports.getPosts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const posts = await CommunityPost.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const userId = req.user._id.toString();
  const enriched = posts.map(p => ({
    ...p,
    isLiked: p.likes?.some(l => l.toString() === userId) || false,
    likeCount: p.likes?.length || 0,
  }));

  const total = await CommunityPost.countDocuments();
  res.json({ posts: enriched, total, page, pages: Math.ceil(total / limit) });
});

exports.createPost = asyncHandler(async (req, res) => {
  const { content, imageUrl } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });

  const user = req.user;
  const streakDays = user.gamification.streakDays;
  let badge = '';
  if (streakDays >= 30) badge = '30 Days Sober';
  else if (streakDays >= 7) badge = 'Milestone';
  else badge = 'Seeking Support';

  const post = await CommunityPost.create({
    authorId: user._id,
    authorName: user.name,
    authorAvatar: user.avatarUrl,
    badge,
    content,
    imageUrl: imageUrl || '',
  });

  res.status(201).json({ post });
});

exports.toggleLike = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const userId = req.user._id;
  const idx = post.likes.findIndex(l => l.toString() === userId.toString());

  if (idx > -1) {
    post.likes.splice(idx, 1);
  } else {
    post.likes.push(userId);
  }
  post.likeCount = post.likes.length;
  await post.save();

  res.json({ likeCount: post.likeCount, isLiked: idx === -1 });
});

exports.addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  const post = await CommunityPost.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  post.comments.push({
    authorId: req.user._id,
    authorName: req.user.name,
    authorAvatar: req.user.avatarUrl,
    text,
  });
  await post.save();

  res.json({ comments: post.comments });
});

exports.deletePost = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.authorId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  await post.deleteOne();
  res.json({ deleted: true });
});

exports.getGroups = asyncHandler(async (req, res) => {
  const groups = await Group.find().lean();
  const userId = req.user._id.toString();
  const enriched = groups.map(g => ({
    ...g,
    id: g._id,
    joined: g.members?.some(m => m.toString() === userId) || false,
  }));
  res.json({ groups: enriched });
});

exports.joinGroup = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const userId = req.user._id;
  if (group.members.some(m => m.toString() === userId.toString())) {
    return res.status(400).json({ error: 'Already joined' });
  }

  group.members.push(userId);
  group.memberCount = group.members.length;
  await group.save();
  res.json({ joined: true, memberCount: group.memberCount });
});

exports.leaveGroup = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const userId = req.user._id;
  const idx = group.members.findIndex(m => m.toString() === userId.toString());
  if (idx === -1) return res.status(400).json({ error: 'Not a member' });

  group.members.splice(idx, 1);
  group.memberCount = group.members.length;
  await group.save();
  res.json({ joined: false, memberCount: group.memberCount });
});

exports.getCircle = asyncHandler(async (req, res) => {
  const user = req.user;

  const emergencyContacts = (user.onboarding?.emergencyContacts || []).map(c => ({
    id: c._id?.toString() || c.acquaintanceUserId?.toString() || null,
    role: c.role || 'contact',
    name: c.name || 'Unknown',
    phone: c.phone || '',
    email: c.email || '',
    acquaintanceUserId: c.acquaintanceUserId || null,
    hasAccount: !!c.acquaintanceUserId,
    lastActive: null,
  }));

  const acquaintances = await User.find({
    linkedUserId: user._id,
    role: 'acquaintance',
  }).select('_id name linkedRelationship gamification.lastActiveDate').lean();

  const acquaintanceMap = new Map();
  acquaintances.forEach(a => acquaintanceMap.set(a._id.toString(), a));

  const enrichedContacts = emergencyContacts.map(c => {
    if (c.acquaintanceUserId) {
      const acct = acquaintanceMap.get(c.acquaintanceUserId.toString());
      if (acct) {
        return { ...c, hasAccount: true, lastActive: acct.gamification?.lastActiveDate || null };
      }
    }
    return c;
  });

  const contactAcqIds = new Set(
    emergencyContacts.filter(c => c.acquaintanceUserId).map(c => c.acquaintanceUserId.toString())
  );

  const additionalAcquaintances = acquaintances
    .filter(a => !contactAcqIds.has(a._id.toString()))
    .map(a => ({
      id: a._id.toString(),
      role: a.linkedRelationship || 'acquaintance',
      name: a.name,
      phone: '',
      email: '',
      acquaintanceUserId: a._id,
      hasAccount: true,
      lastActive: a.gamification?.lastActiveDate || null,
    }));

  res.json({ circle: [...enrichedContacts, ...additionalAcquaintances] });
});
