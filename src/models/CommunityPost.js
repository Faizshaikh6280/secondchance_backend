const mongoose = require('mongoose');

const CommunityPostSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String },
  authorAvatar: { type: String },
  badge: { type: String, default: '' },
  content: { type: String, required: true, maxlength: 2000 },
  imageUrl: { type: String, default: '' },

  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likeCount: { type: Number, default: 0 },

  comments: [{
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorName: { type: String },
    authorAvatar: { type: String },
    text: { type: String, maxlength: 1000 },
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

CommunityPostSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CommunityPost', CommunityPostSchema);
