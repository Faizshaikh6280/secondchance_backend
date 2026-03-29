const mongoose = require('mongoose');

const CopingSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  stepsCompleted: { type: Number, default: 0 },

  cravingLevel: { type: Number, min: 0, max: 10 },
  mood: { type: String },
  trigger: { type: String },

  mlResponse: { type: mongoose.Schema.Types.Mixed, default: null },

  outcome: {
    cravingAfter: { type: Number, min: 0, max: 10 },
    helpful: { type: Boolean, default: null },
  },
}, { timestamps: true });

CopingSessionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('CopingSession', CopingSessionSchema);
