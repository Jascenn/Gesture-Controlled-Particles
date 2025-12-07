

export enum HandGesture {
  NONE = 'NONE',
  OPEN_PALM = 'OPEN_PALM',
  CLOSED_FIST = 'CLOSED_FIST',
  POINTING = 'POINTING',
  VICTORY = 'VICTORY',
  THUMBS_UP = 'THUMBS_UP',
  PINCH = 'PINCH',
  ROCK = 'ROCK',
  LOVE = 'LOVE',
  SHAKA = 'SHAKA',
  OK_SIGN = 'OK_SIGN',
  PINKY = 'PINKY',
  VULCAN = 'VULCAN',
  SPIDERMAN = 'SPIDERMAN',
  CROSS = 'CROSS',
  GUN = 'GUN',
  CLAW = 'CLAW',
  SWORD = 'SWORD'
}

export interface HandState {
  detected: boolean;
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
  gesture: HandGesture;
}

export interface TrigramInfo {
  name: string;
  chinese: string;
  meaning: string;
  element: string;
  animal: string; // Derived from Research Report (Table A)
  color: string;  // Hex color for particle visualization
  angle: number;  // Radians
  lines: number[]; // Bottom to top: 0 for Yin (broken), 1 for Yang (solid)
}

// Data Source: Table A from "Gemini Bagua & Gestures Research Report"
export const TRIGRAMS: TrigramInfo[] = [
  { name: 'Qian', chinese: '乾', meaning: 'Heaven', element: 'Metal', animal: 'Lion', color: '#f8fafc', angle: 0, lines: [1, 1, 1] }, // Sky/White/Silver
  { name: 'Xun', chinese: '巽', meaning: 'Wind', element: 'Wood', animal: 'Phoenix', color: '#4ade80', angle: Math.PI / 4, lines: [0, 1, 1] }, // Green
  { name: 'Kan', chinese: '坎', meaning: 'Water', element: 'Water', animal: 'Snake', color: '#3b82f6', angle: Math.PI / 2, lines: [0, 1, 0] }, // Blue
  { name: 'Gen', chinese: '艮', meaning: 'Mountain', element: 'Earth', animal: 'Bear', color: '#a16207', angle: (3 * Math.PI) / 4, lines: [0, 0, 1] }, // Brown
  { name: 'Kun', chinese: '坤', meaning: 'Earth', element: 'Earth', animal: 'Ox', color: '#fbbf24', angle: Math.PI, lines: [0, 0, 0] }, // Yellow/Ochre
  { name: 'Zhen', chinese: '震', meaning: 'Thunder', element: 'Wood', animal: 'Dragon', color: '#22c55e', angle: (5 * Math.PI) / 4, lines: [1, 0, 0] }, // Emerald
  { name: 'Li', chinese: '離', meaning: 'Fire', element: 'Fire', animal: 'Hawk', color: '#ef4444', angle: (3 * Math.PI) / 2, lines: [1, 0, 1] }, // Red
  { name: 'Dui', chinese: '兌', meaning: 'Lake', element: 'Metal', animal: 'Monkey', color: '#94a3b8', angle: (7 * Math.PI) / 4, lines: [1, 1, 0] }, // Metallic Grey
];