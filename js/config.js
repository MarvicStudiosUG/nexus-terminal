// ============================================================
//  config.js - Themes, constants, and global configuration
// ============================================================

export const MAX_OUTPUT_LINES = 500;
export const DEFAULT_FONT_SIZE = 14;

export const themes = {
  default: { cyan: '#00ffcc', blue: '#0088ff', thumb: '#00ffcc', bg: '#080c14' },
  ocean: { cyan: '#4dc9f6', blue: '#0277bd', thumb: '#4dc9f6', bg: '#0a1628' },
  mono: { cyan: '#aaaaaa', blue: '#666666', thumb: '#aaaaaa', bg: '#0a0a0a' },
  matrix: { cyan: '#00ff41', blue: '#008f11', thumb: '#00ff41', bg: '#0a0f0a' },
  sunset: { cyan: '#ff6b6b', blue: '#ee5a24', thumb: '#ff6b6b', bg: '#1a0a0a' }
};

export const leagueMap = {
  "english premier league": "4328",
  "premier league": "4328",
  "epl": "4328",
  "la liga": "4335",
  "bundesliga": "4331",
  "serie a": "4332",
  "ligue 1": "4334",
  "uefa champions league": "4480"
};

export const worldZones = [
  { n: 'New York', tz: 'America/New_York' },
  { n: 'London', tz: 'Europe/London' },
  { n: 'Tokyo', tz: 'Asia/Tokyo' },
  { n: 'Dubai', tz: 'Asia/Dubai' },
  { n: 'Sydney', tz: 'Australia/Sydney' }
];
