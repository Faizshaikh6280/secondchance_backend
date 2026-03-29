const User = require('../models/User');
const DietLog = require('../models/DietLog');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');

exports.getDashboard = asyncHandler(async (req, res) => {
  const user = req.user;
  if (user.role !== 'acquaintance') {
    return res.status(403).json({ error: 'Not an acquaintance account' });
  }

  const addict = await User.findById(user.linkedUserId).select('-passwordHash');
  if (!addict) {
    return res.status(404).json({ error: 'Linked user not found' });
  }

  // Get addict's most recent diet plan
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let dietLog = await DietLog.findOne({ userId: addict._id, date: { $gte: today } });
  if (!dietLog) {
    dietLog = await DietLog.findOne({ userId: addict._id }).sort({ date: -1 });
  }

  // Get unread notification count
  const unreadCount = await Notification.countDocuments({ recipientId: user._id, read: false });

  // Get recent notifications
  const notifications = await Notification.find({ recipientId: user._id })
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({
    addictName: addict.name,
    relationship: user.linkedRelationship,
    dietPlan: dietLog ? {
      meals: dietLog.meals,
      dailyGoals: dietLog.dailyGoals,
      date: dietLog.date,
    } : null,
    notifications,
    unreadCount,
  });
});

exports.getNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 20;

  const notifications = await Notification.find({ recipientId: req.user._id })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Notification.countDocuments({ recipientId: req.user._id });

  res.json({ notifications, total, page, pages: Math.ceil(total / limit) });
});

exports.markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipientId: req.user._id },
    { read: true },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  res.json({ notification });
});
