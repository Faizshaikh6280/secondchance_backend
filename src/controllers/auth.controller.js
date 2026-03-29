const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');
const asyncHandler = require('../utils/asyncHandler');
const { updateStreak } = require('../services/streak');

function sanitizeUser(user) {
  const obj = user.toObject();
  delete obj.passwordHash;
  return obj;
}

exports.register = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash, name });
  const token = signToken(user._id);

  res.status(201).json({ token, user: sanitizeUser(user) });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  updateStreak(user);
  await user.save();

  const token = signToken(user._id);
  res.json({ token, user: sanitizeUser(user) });
});

exports.getMe = asyncHandler(async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});
