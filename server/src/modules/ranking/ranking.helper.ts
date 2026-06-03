export function getPreviousPeriod(period: string): string {
  const match = period.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return "";
  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);
  if (week > 1) {
    return `${year}-W${String(week - 1).padStart(2, "0")}`;
  }
  
  // week 1: go to previous year
  const prevYear = year - 1;
  // December 28 is guaranteed to be in the last week of the year.
  const d = new Date(prevYear, 11, 28);
  const date = new Date(d.valueOf());
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7) + 3);
  const ms = date.valueOf();
  date.setMonth(0, 1);
  if (date.getDay() !== 4) {
    date.setMonth(0, 1 + ((4 - date.getDay() + 7) % 7));
  }
  const weeks = Math.round((ms - date.valueOf()) / 604800000) + 1;
  return `${prevYear}-W${weeks}`;
}
