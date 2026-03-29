const mongoose = require('mongoose');

const RecoveryProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  journey: [{
    weekNum: { type: Number },
    title: { type: String },
    days: [{
      dayNum: { type: Number },
      status: { type: String, enum: ['locked', 'active', 'completed'], default: 'locked' },
      tasks: [{
        taskId: { type: String },
        title: { type: String },
        time: { type: String },
        done: { type: Boolean, default: false },
      }],
      completedAt: { type: Date, default: null },
    }],
  }],

  dailyTasks: [{
    date: { type: Date },
    tasks: [{
      taskId: { type: String },
      title: { type: String },
      time: { type: String },
      completed: { type: Boolean, default: false },
    }],
  }],

  cravingLog: [{
    date: { type: Date },
    intensity: { type: Number, min: 0, max: 10 },
  }],

  moodLog: [{
    date: { type: Date },
    mood: { type: Number, min: 1, max: 5 },
  }],

  bodyHealing: {
    lungs: { type: Number, default: 0 },
    heart: { type: Number, default: 0 },
    bloodPressure: { type: Number, default: 0 },
    moneySaved: { type: Number, default: 0 },
  },

  mlRecoveryPlan: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true });

RecoveryProgressSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('RecoveryProgress', RecoveryProgressSchema);
