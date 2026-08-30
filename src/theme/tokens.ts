/**
 * The twelve tokens every surface reads from. A theme is one override block.
 *
 * Accents are authored in OKLCH in the design (`oklch(L C H)`); React Native has no
 * OKLCH parser, so they are converted here. Values were produced by an Oklab -> linear
 * sRGB conversion with chroma-reduction gamut mapping (Midnight `acc` sits just outside
 * sRGB at C 0.15 and maps to C 0.146). Accents share L and C and vary only in hue —
 * keep that rule when adding a theme.
 */
export type ThemeId = 'midnight' | 'daylight' | 'sakura';

export type Tokens = {
  bg: string;
  bg2: string;
  bg3: string;
  bar: string;
  line: string;
  stripe: string;
  fg: string;
  fg2: string;
  fg3: string;
  acc: string;
  acc2: string;
  onAcc: string;
};

export type Theme = {
  id: ThemeId;
  name: string;
  note: string;
  dark: boolean;
  tokens: Tokens;
};

export const THEMES: Record<ThemeId, Theme> = {
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    note: 'Default · dark',
    dark: true,
    tokens: {
      bg: '#0B0D12',
      bg2: '#14181F',
      bg3: '#1C212B',
      bar: 'rgba(11,13,18,0.82)',
      line: 'rgba(255,255,255,0.09)',
      stripe: 'rgba(255,255,255,0.05)',
      fg: '#ECEEF3',
      fg2: '#98A1B2',
      fg3: '#5F6879',
      acc: '#8B9BFF', // oklch(0.72 0.15 275)
      acc2: '#F47B74', // oklch(0.72 0.15 25)
      onAcc: '#0B0D12',
    },
  },
  daylight: {
    id: 'daylight',
    name: 'Daylight',
    note: 'Light',
    dark: false,
    tokens: {
      bg: '#F8F8F6',
      bg2: '#FFFFFF',
      bg3: '#EDEDEA',
      bar: 'rgba(255,255,255,0.86)',
      line: 'rgba(0,0,0,0.10)',
      stripe: 'rgba(0,0,0,0.05)',
      fg: '#14161A',
      fg2: '#5C6270',
      fg3: '#8A909C',
      acc: '#5965CD', // oklch(0.55 0.16 275)
      acc2: '#BD413F', // oklch(0.55 0.16 25)
      onAcc: '#FFFFFF',
    },
  },
  sakura: {
    id: 'sakura',
    name: 'Sakura',
    note: 'Dark · warm',
    dark: true,
    tokens: {
      bg: '#150A10',
      bg2: '#1F1119',
      bg3: '#2B1722',
      bar: 'rgba(21,10,16,0.82)',
      line: 'rgba(255,255,255,0.10)',
      stripe: 'rgba(255,255,255,0.05)',
      fg: '#F6EAEF',
      fg2: '#BC9EAB',
      fg3: '#7E6470',
      acc: '#EF87BA', // oklch(0.75 0.14 350)
      acc2: '#EE9748', // oklch(0.75 0.14 60)
      onAcc: '#150A10',
    },
  },
};

export const THEME_ORDER: ThemeId[] = ['midnight', 'daylight', 'sakura'];

/** Screen gutter, section rhythm and the radii the design uses. */
export const S = {
  gutter: 16,
  section: 22,
  row: 13,
} as const;

export const R = {
  pill: 999,
  button: 13,
  input: 11,
  card: 14,
  poster: 11,
  thumb: 7,
  sheet: 24,
  avatar: 22,
} as const;

export const HAIRLINE = 1;
