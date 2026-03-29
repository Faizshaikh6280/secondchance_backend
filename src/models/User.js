const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  avatarUrl: { type: String, default: '' },
  role: { type: String, enum: ['user', 'acquaintance'], default: 'user' },
  linkedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  linkedRelationship: { type: String, default: '' },

  onboarding: {
    completed: { type: Boolean, default: false },
    type: { type: String, enum: ['alcohol', 'smoking', 'drugs', 'digital', 'sugar', 'other'], default: null },
    duration: { type: String, enum: ['<6m', '6m-1y', '1-3y', '3-5y', '>5y'], default: null },
    cravingTime: { type: String, enum: ['morning', 'afternoon', 'evening', 'night', 'random'], default: null },
    trigger: { type: String, enum: ['stress', 'loneliness', 'anger', 'boredom', 'social'], default: null },
    motivation: { type: String, enum: ['family', 'health', 'finance', 'mind', 'growth'], default: null },
    anchorImages: [{ type: String }],
    emergencyContacts: [{
      role: { type: String },
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      acquaintanceUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    }],
  },

  extendedProfile: {
    age: { type: Number, default: 30 },
    gender: { type: String, default: 'prefer_not_to_say' },
    sex: { type: String, default: 'other' },
    heightCm: { type: Number, default: 170 },
    weightKg: { type: Number, default: 70 },
    educationLevel: { type: String, default: 'graduate' },
    employmentStatus: { type: String, default: 'employed' },
    incomeBracket: { type: String, default: 'middle' },
    activityLevel: { type: String, default: 'low' },
    regionCountry: { type: String, default: 'India' },
    dietType: { type: String, default: 'mixed' },
    budgetLevel: { type: String, default: 'medium' },
  },

  gamification: {
    xp: { type: Number, default: 0 },
    gems: { type: Number, default: 0 },
    streakDays: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null },
    completedChallenges: { type: Number, default: 0 },
    stats: {
      activitiesCompleted: { type: Number, default: 0 },
      dietPlansFollowed: { type: Number, default: 0 },
      challengeMilestonesCompleted: { type: Number, default: 0 },
    },
    rewardedActions: { type: Map, of: Boolean, default: {} },
  },

  recoveryStartDate: { type: Date, default: Date.now },

  mlCache: {
    communityRisk: { type: mongoose.Schema.Types.Mixed, default: null },
    dietPlan: { type: mongoose.Schema.Types.Mixed, default: null },
    recoveryPlan: { type: mongoose.Schema.Types.Mixed, default: null },
    lastUpdated: { type: Date, default: null },
  },
}, { timestamps: true });

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ 'gamification.xp': -1 });

module.exports = mongoose.model('User', UserSchema);
