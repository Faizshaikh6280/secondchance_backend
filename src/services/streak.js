function updateStreak(user) {
  const now = new Date();
  const today = now.toDateString();
  const lastActive = user.gamification.lastActiveDate?.toDateString();

  if (lastActive === today) return;

  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (lastActive === yesterday) {
    user.gamification.streakDays += 1;
  } else if (lastActive !== today) {
    user.gamification.streakDays = 1;
  }

  user.gamification.lastActiveDate = now;
}

module.exports = { updateStreak };
