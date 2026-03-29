require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const Challenge = require('../models/Challenge');
const CommunityPost = require('../models/CommunityPost');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB for seeding...');

  // Seed Challenges
  const existingChallenges = await Challenge.countDocuments();
  if (existingChallenges === 0) {
    await Challenge.insertMany([
      {
        title: 'Sober September Sprint',
        type: 'Alcohol',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 86400000),
        benefits: ['Liver Healing', 'Save Money', 'Deep Sleep'],
        totalPoints: 500,
        theme: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', tagBg: 'bg-orange-100' },
        tasks: [
          { taskId: 'c1-t1', title: 'Create your trigger map', points: 100 },
          { taskId: 'c1-t2', title: 'Attend a social event sober', points: 150 },
          { taskId: 'c1-t3', title: 'Complete 7-day streak', points: 150 },
          { taskId: 'c1-t4', title: 'Help a peer in community', points: 100 },
        ],
        participantCount: 12450,
      },
      {
        title: 'Smoke-Free Weekend',
        type: 'Smoking',
        status: 'upcoming',
        startDate: new Date(Date.now() + 7 * 86400000),
        endDate: new Date(Date.now() + 9 * 86400000),
        benefits: ['Lung Capacity', 'Reduce Anxiety', 'Better Taste'],
        totalPoints: 400,
        theme: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', tagBg: 'bg-blue-100' },
        tasks: [
          { taskId: 'c2-t1', title: 'Replace smoking with walking', points: 100 },
          { taskId: 'c2-t2', title: 'Use breathing exercises 3x', points: 100 },
          { taskId: 'c2-t3', title: 'Journal your triggers', points: 100 },
          { taskId: 'c2-t4', title: 'Complete 48-hour smoke free', points: 100 },
        ],
        participantCount: 8320,
      },
      {
        title: 'Digital Detox: 7 Days',
        type: 'Digital',
        status: 'completed',
        startDate: new Date(Date.now() - 14 * 86400000),
        endDate: new Date(Date.now() - 7 * 86400000),
        benefits: ['Focus Boost', 'Better Sleep', 'Real Connections'],
        totalPoints: 600,
        theme: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', tagBg: 'bg-purple-100' },
        tasks: [
          { taskId: 'c3-t1', title: 'No social media for 24h', points: 150 },
          { taskId: 'c3-t2', title: 'Read a physical book', points: 100 },
          { taskId: 'c3-t3', title: 'Have an in-person conversation', points: 150 },
          { taskId: 'c3-t4', title: 'Complete full 7-day challenge', points: 200 },
        ],
        participantCount: 25100,
      },
    ]);
    console.log('Challenges seeded');
  }

  // Seed Community Posts
  const existingPosts = await CommunityPost.countDocuments();
  if (existingPosts === 0) {
    await CommunityPost.insertMany([
      {
        authorId: new mongoose.Types.ObjectId(),
        authorName: 'Sarah M.',
        authorAvatar: '',
        badge: '30 Days Sober',
        content: 'Just hit my 30-day milestone! The first week was the hardest but having this community made all the difference. If you are struggling, know that it does get easier.',
        likes: [],
        likeCount: 124,
      },
      {
        authorId: new mongoose.Types.ObjectId(),
        authorName: 'Anonymous',
        authorAvatar: '',
        badge: 'Seeking Support',
        content: 'Having a tough evening. The stress from work is making me want to reach for old habits. Any tips for managing evening cravings?',
        likes: [],
        likeCount: 89,
        comments: [
          {
            authorId: new mongoose.Types.ObjectId(),
            authorName: 'Recovery Coach',
            authorAvatar: '',
            text: 'Try the 5-4-3-2-1 grounding technique. It really helps break the craving cycle. You\'ve got this!',
          },
        ],
      },
      {
        authorId: new mongoose.Types.ObjectId(),
        authorName: 'David K.',
        authorAvatar: '',
        badge: 'Milestone',
        content: 'Sugar addiction is real and often overlooked. Been 2 weeks without processed sugar and my energy levels are through the roof. Sharing my meal plan that helped.',
        likes: [],
        likeCount: 210,
      },
    ]);
    console.log('Community posts seeded');
  }

  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
