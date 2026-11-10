// The one home of the calendar's lengths, in ticks (1 tick is 1 game hour, D-002).
const HOURS_PER_DAY = 24;
const DAYS_PER_SEASON = 7;
const SEASONS_PER_YEAR = 4;
const HOURS_PER_SEASON = HOURS_PER_DAY * DAYS_PER_SEASON;
const HOURS_PER_YEAR = HOURS_PER_SEASON * SEASONS_PER_YEAR;
export const DAY_TICKS = HOURS_PER_DAY;
export const SEASON_TICKS = HOURS_PER_SEASON;
export const YEAR_TICKS = HOURS_PER_YEAR;

export function calendar(tick: number): {
  year: number;
  season: 0 | 1 | 2 | 3;
  day: number;
  hour: number;
} {
  const inYear = tick % HOURS_PER_YEAR;
  const inSeason = inYear % HOURS_PER_SEASON;
  return {
    year: Math.floor(tick / HOURS_PER_YEAR) + 1,
    season: Math.floor(inYear / HOURS_PER_SEASON) as 0 | 1 | 2 | 3,
    day: Math.floor(inSeason / HOURS_PER_DAY) + 1,
    hour: inSeason % HOURS_PER_DAY,
  };
}
