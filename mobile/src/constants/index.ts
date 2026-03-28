export const PANTRY_CATEGORIES = [
  'produce',
  'dairy',
  'protein',
  'grains',
  'spices',
  'condiments',
  'canned',
  'frozen',
  'other',
] as const;

export type PantryCategory = typeof PANTRY_CATEGORIES[number];
