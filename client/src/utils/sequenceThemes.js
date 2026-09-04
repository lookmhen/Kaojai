/**
 * Sequence Race Color Palettes & Symbols
 * Provides high-contrast, visually distinct palettes for each sequence step
 */

export const SEQUENCE_PALETTES = [
  {
    id: 0,
    symbol: '▲',
    label: 'A',
    badgeBg: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
    badgeText: '#FFFFFF',
    cardBg: '#FFF1F2',
    borderColor: '#FECDD3',
    accentBar: '#E11D48',
    glowColor: 'rgba(225, 29, 72, 0.22)',
    numberBadgeBg: '#E11D48',
    subText: '#9F1239'
  },
  {
    id: 1,
    symbol: '◆',
    label: 'B',
    badgeBg: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
    badgeText: '#FFFFFF',
    cardBg: '#EFF6FF',
    borderColor: '#BFDBFE',
    accentBar: '#2563EB',
    glowColor: 'rgba(37, 99, 235, 0.22)',
    numberBadgeBg: '#2563EB',
    subText: '#1E40AF'
  },
  {
    id: 2,
    symbol: '●',
    label: 'C',
    badgeBg: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
    badgeText: '#FFFFFF',
    cardBg: '#FFFBEB',
    borderColor: '#FDE68A',
    accentBar: '#D97706',
    glowColor: 'rgba(217, 119, 6, 0.22)',
    numberBadgeBg: '#D97706',
    subText: '#92400E'
  },
  {
    id: 3,
    symbol: '■',
    label: 'D',
    badgeBg: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    badgeText: '#FFFFFF',
    cardBg: '#ECFDF5',
    borderColor: '#A7F3D0',
    accentBar: '#059669',
    glowColor: 'rgba(5, 150, 105, 0.22)',
    numberBadgeBg: '#059669',
    subText: '#065F46'
  },
  {
    id: 4,
    symbol: '★',
    label: 'E',
    badgeBg: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
    badgeText: '#FFFFFF',
    cardBg: '#F5F3FF',
    borderColor: '#DDD6FE',
    accentBar: '#7C3AED',
    glowColor: 'rgba(124, 58, 237, 0.22)',
    numberBadgeBg: '#7C3AED',
    subText: '#5B21B6'
  },
  {
    id: 5,
    symbol: '⬟',
    label: 'F',
    badgeBg: 'linear-gradient(135deg, #0891B2 0%, #0E7490 100%)',
    badgeText: '#FFFFFF',
    cardBg: '#ECFEFF',
    borderColor: '#A5F3FC',
    accentBar: '#0891B2',
    glowColor: 'rgba(8, 145, 178, 0.22)',
    numberBadgeBg: '#0891B2',
    subText: '#155E75'
  }
];

export function getSequenceTheme(itemOrId, origList = []) {
  if (typeof itemOrId === 'number') {
    return SEQUENCE_PALETTES[itemOrId % SEQUENCE_PALETTES.length];
  }
  const id = typeof itemOrId === 'object' && itemOrId !== null ? itemOrId.id : itemOrId;
  const foundIdx = origList.findIndex(x => (typeof x === 'object' ? x.id === id : x === id));
  const idx = foundIdx >= 0 ? foundIdx : 0;
  return SEQUENCE_PALETTES[idx % SEQUENCE_PALETTES.length];
}
