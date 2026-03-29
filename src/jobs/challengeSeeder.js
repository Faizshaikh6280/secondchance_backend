const Challenge = require('../models/Challenge');

const CHALLENGES = [
  // --- 7-Day Challenges (high-risk / early recovery) ---
  {
    title: '7-Day Sober Start',
    type: 'Recovery',
    status: 'active',
    startDate: new Date(Date.now() - 2 * 86400000),
    endDate: new Date(Date.now() + 5 * 86400000),
    benefits: ['Build Momentum', 'Dopamine Reset', 'Self-Confidence'],
    totalPoints: 500,
    theme: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', tagBg: 'bg-emerald-100' },
    tasks: [
      { taskId: '7ss-1', title: 'Log 3 consecutive sober days', points: 100 },
      { taskId: '7ss-2', title: 'Complete a breathing exercise', points: 80 },
      { taskId: '7ss-3', title: 'Write a journal entry about triggers', points: 70 },
      { taskId: '7ss-4', title: 'Help a peer in the community', points: 100 },
      { taskId: '7ss-5', title: 'Log all 7 sober days', points: 150 },
    ],
  },
  {
    title: 'Weekly Mindfulness Reset',
    type: 'Wellness',
    status: 'active',
    startDate: new Date(Date.now() - 1 * 86400000),
    endDate: new Date(Date.now() + 6 * 86400000),
    benefits: ['Reduce Anxiety', 'Better Focus', 'Inner Peace'],
    totalPoints: 450,
    theme: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', tagBg: 'bg-purple-100' },
    tasks: [
      { taskId: 'wmr-1', title: '3-minute breathing for 3 days', points: 90 },
      { taskId: 'wmr-2', title: 'Walk 10 minutes for 3 days', points: 90 },
      { taskId: 'wmr-3', title: 'Journal reflection for 2 days', points: 80 },
      { taskId: 'wmr-4', title: 'Sleep before 11pm for 3 nights', points: 100 },
      { taskId: 'wmr-5', title: 'Write a gratitude list', points: 90 },
    ],
  },
  {
    title: 'Hydration & Nutrition Week',
    type: 'Health',
    status: 'upcoming',
    startDate: new Date(Date.now() + 3 * 86400000),
    endDate: new Date(Date.now() + 10 * 86400000),
    benefits: ['Body Repair', 'Energy Boost', 'Gut Health'],
    totalPoints: 400,
    theme: { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200', tagBg: 'bg-sky-100' },
    tasks: [
      { taskId: 'hnw-1', title: 'Drink 8 glasses of water for 3 days', points: 80 },
      { taskId: 'hnw-2', title: 'Follow your diet plan for 3 days', points: 90 },
      { taskId: 'hnw-3', title: 'No added sugar for 2 days', points: 80 },
      { taskId: 'hnw-4', title: 'Cook a healthy meal from scratch', points: 70 },
      { taskId: 'hnw-5', title: 'Log all meals for 1 full day', points: 80 },
    ],
  },

  // --- 30-Day Challenges (medium-risk) ---
  {
    title: '30-Day Clean Streak',
    type: 'Recovery',
    status: 'active',
    startDate: new Date(Date.now() - 5 * 86400000),
    endDate: new Date(Date.now() + 25 * 86400000),
    benefits: ['Deep Healing', 'Habit Formation', 'Community Bond'],
    totalPoints: 800,
    theme: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', tagBg: 'bg-blue-100' },
    tasks: [
      { taskId: '30cs-1', title: 'Complete your first sober week', points: 120 },
      { taskId: '30cs-2', title: 'Share progress in the community', points: 100 },
      { taskId: '30cs-3', title: 'Follow your diet plan for 10 days', points: 150 },
      { taskId: '30cs-4', title: 'Attend 2 peer support events', points: 130 },
      { taskId: '30cs-5', title: 'Complete week 4 of recovery', points: 150 },
      { taskId: '30cs-6', title: 'Help 3 peers in their journey', points: 150 },
    ],
  },
  {
    title: 'Fitness for Recovery',
    type: 'Fitness',
    status: 'active',
    startDate: new Date(Date.now() - 3 * 86400000),
    endDate: new Date(Date.now() + 27 * 86400000),
    benefits: ['Endorphin Release', 'Better Sleep', 'Physical Strength'],
    totalPoints: 750,
    theme: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', tagBg: 'bg-orange-100' },
    tasks: [
      { taskId: 'ffr-1', title: 'Walk 30 minutes 10 times', points: 130 },
      { taskId: 'ffr-2', title: 'Complete 5 breathing sessions', points: 100 },
      { taskId: 'ffr-3', title: 'Sleep 7+ hours for 15 nights', points: 150 },
      { taskId: 'ffr-4', title: 'Complete 1 outdoor activity', points: 120 },
      { taskId: 'ffr-5', title: 'Track your mood for 20 days', points: 130 },
      { taskId: 'ffr-6', title: 'Do 3 strength exercises', points: 120 },
    ],
  },
  {
    title: 'Community Champion',
    type: 'Social',
    status: 'upcoming',
    startDate: new Date(Date.now() + 5 * 86400000),
    endDate: new Date(Date.now() + 35 * 86400000),
    benefits: ['Social Support', 'Leadership', 'Accountability'],
    totalPoints: 700,
    theme: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200', tagBg: 'bg-pink-100' },
    tasks: [
      { taskId: 'cc-1', title: 'Post 5 times in the community', points: 100 },
      { taskId: 'cc-2', title: 'Like and support 15 posts', points: 120 },
      { taskId: 'cc-3', title: 'Reply to 5 peers with encouragement', points: 120 },
      { taskId: 'cc-4', title: 'Share your recovery story', points: 130 },
      { taskId: 'cc-5', title: 'Invite 1 friend to the platform', points: 100 },
      { taskId: 'cc-6', title: 'Host or join a group chat', points: 130 },
    ],
  },

  // --- 90-Day Challenges (low-risk / maintenance) ---
  {
    title: '90-Day Transformation',
    type: 'Recovery',
    status: 'active',
    startDate: new Date(Date.now() - 10 * 86400000),
    endDate: new Date(Date.now() + 80 * 86400000),
    benefits: ['Life Overhaul', 'Identity Shift', 'Lasting Freedom'],
    totalPoints: 1200,
    theme: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', tagBg: 'bg-amber-100' },
    tasks: [
      { taskId: '90t-1', title: 'Complete your first 30 days sober', points: 200 },
      { taskId: '90t-2', title: 'Mentor a newcomer in recovery', points: 180 },
      { taskId: '90t-3', title: 'Follow your diet plan for 60 days', points: 250 },
      { taskId: '90t-4', title: 'Complete your second month', points: 200 },
      { taskId: '90t-5', title: 'Write a recovery letter to yourself', points: 170 },
      { taskId: '90t-6', title: 'Celebrate 90 days of transformation', points: 200 },
    ],
  },
  {
    title: 'Master Wellness Warrior',
    type: 'Wellness',
    status: 'active',
    startDate: new Date(Date.now() - 7 * 86400000),
    endDate: new Date(Date.now() + 83 * 86400000),
    benefits: ['Mind-Body Balance', 'Peak Health', 'Discipline'],
    totalPoints: 1100,
    theme: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200', tagBg: 'bg-teal-100' },
    tasks: [
      { taskId: 'mww-1', title: 'Complete 30 breathing sessions', points: 180 },
      { taskId: 'mww-2', title: 'Walk 50+ times', points: 200 },
      { taskId: 'mww-3', title: 'Journal for 60 days', points: 200 },
      { taskId: 'mww-4', title: 'Maintain sleep schedule for 45 nights', points: 180 },
      { taskId: 'mww-5', title: 'Follow all diet plans for 30 days', points: 180 },
      { taskId: 'mww-6', title: 'Help 10 community members', points: 160 },
    ],
  },
  {
    title: 'Leadership Path',
    type: 'Social',
    status: 'upcoming',
    startDate: new Date(Date.now() + 7 * 86400000),
    endDate: new Date(Date.now() + 97 * 86400000),
    benefits: ['Influence', 'Legacy', 'Deep Connection'],
    totalPoints: 1000,
    theme: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', tagBg: 'bg-indigo-100' },
    tasks: [
      { taskId: 'lp-1', title: 'Reach top 10 in the leaderboard', points: 180 },
      { taskId: 'lp-2', title: 'Help 20 peers in their recovery', points: 180 },
      { taskId: 'lp-3', title: 'Share 10 recovery stories', points: 160 },
      { taskId: 'lp-4', title: 'Complete 3 other challenges', points: 170 },
      { taskId: 'lp-5', title: 'Maintain a 60-day active streak', points: 160 },
      { taskId: 'lp-6', title: 'Earn 5000 total XP', points: 150 },
    ],
  },
];

async function seedChallenges() {
  try {
    const count = await Challenge.countDocuments();
    if (count > 0) {
      console.log(`[Seeder] ${count} challenges already exist — skipping`);
      return;
    }

    await Challenge.insertMany(CHALLENGES);
    console.log(`[Seeder] Created ${CHALLENGES.length} challenges`);
  } catch (err) {
    console.log(`[Seeder] Error: ${err.message}`);
  }
}

module.exports = { seedChallenges };
