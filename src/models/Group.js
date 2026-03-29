const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '' },
  category: { type: String, default: 'general' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  memberCount: { type: Number, default: 0 },
}, { timestamps: true });

GroupSchema.index({ category: 1 });

module.exports = mongoose.model('Group', GroupSchema);
