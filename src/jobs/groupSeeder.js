const Group = require('../models/Group');

const GROUPS = [
  { name: 'Alcohol Free Journey', description: 'Support for those on the path to sobriety.', icon: '\u{1F37A}', category: 'recovery' },
  { name: 'Digital Detox', description: 'Breaking free from screen addiction together.', icon: '\u{1F4F1}', category: 'lifestyle' },
  { name: 'Sugar Craving Support', description: 'Managing sugar cravings and building healthy habits.', icon: '\u{1F36C}', category: 'wellness' },
  { name: 'Smoking Cessation', description: 'A community for quitting smoking for good.', icon: '\u{1F6AD}', category: 'recovery' },
  { name: 'Mindful Living', description: 'Practicing mindfulness and meditation for recovery.', icon: '\u{1F9D8}', category: 'wellness' },
  { name: 'Fitness & Recovery', description: 'Using exercise as a tool for healing.', icon: '\u{1F4AA}', category: 'wellness' },
];

async function seedGroups() {
  try {
    const count = await Group.countDocuments();
    if (count > 0) {
      console.log(`[Seeder] ${count} groups already exist — skipping`);
      return;
    }

    await Group.insertMany(GROUPS);
    console.log(`[Seeder] Created ${GROUPS.length} groups`);
  } catch (err) {
    console.log(`[Seeder] Error: ${err.message}`);
  }
}

module.exports = { seedGroups };
