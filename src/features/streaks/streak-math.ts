const dayNumber = (date: string) => Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);

export const calculateNextStreak = (
  previousDate: string | null,
  currentDate: string,
  currentStreak: number,
  longestStreak: number,
) => {
  if (!previousDate)
    return { currentStreak: 1, longestStreak: Math.max(1, longestStreak) };
  const difference = dayNumber(currentDate) - dayNumber(previousDate);
  if (difference === 0) return { currentStreak, longestStreak };
  if (difference === 1) {
    const next = currentStreak + 1;
    return { currentStreak: next, longestStreak: Math.max(longestStreak, next) };
  }
  return { currentStreak: 1, longestStreak: Math.max(1, longestStreak) };
};
