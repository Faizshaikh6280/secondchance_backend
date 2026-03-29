const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, required: true },
  status: { type: String, enum: ['upcoming', 'active', 'completed'], default: 'upcoming' },
  startDate: { type: Date },
  endDate: { type: Date },
  benefits: [{ type: String }],
  totalPoints: { type: Number, default: 500 },
  theme: {
    bg: { type: String },
    text: { type: String },
    border: { type: String },
    tagBg: { type: String },
  },

  tasks: [{
    taskId: { type: String },
    title: { type: String },
    points: { type: Number },
  }],

  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    myPoints: { type: Number, default: 0 },
    completedTasks: [{ type: String }],
  }],

  participantCount: { type: Number, default: 0 },
}, { timestamps: true });

ChallengeSchema.index({ status: 1 });
ChallengeSchema.index({ 'participants.userId': 1 });

module.exports = mongoose.model('Challenge', ChallengeSchema);
