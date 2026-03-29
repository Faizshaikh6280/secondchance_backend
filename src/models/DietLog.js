const mongoose = require('mongoose');

const DietLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },

  dailyGoals: {
    calories: { type: Number, default: 2100 },
    protein: { type: Number, default: 130 },
    carbs: { type: Number, default: 210 },
    fats: { type: Number, default: 65 },
    fiber: { type: Number, default: 30 },
    hydration: { type: Number, default: 2500 },
  },

  meals: [{
    mealId: { type: String },
    mealType: { type: String },
    time: { type: String },
    title: { type: String },
    description: { type: String },
    heroEmoji: { type: String },
    conditions: [{ type: String }],
    nutrients: {
      calories: { type: Number },
      protein: { type: Number },
      carbs: { type: Number },
      fats: { type: Number },
      fiber: { type: Number },
      hydration: { type: Number },
    },
    ingredients: [{
      name: { type: String },
      amount: { type: String },
      icon: { type: String },
      note: { type: String },
    }],
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  }],

  mlDietPlan: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true });

DietLogSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('DietLog', DietLogSchema);
