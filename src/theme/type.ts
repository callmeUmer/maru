import { Platform, TextStyle } from 'react-native';

/**
 * Type helpers mirroring the design's `font: <weight> <size>/<line-height> <family>` shorthand.
 * CSS letter-spacing is authored in em; React Native takes points, so it is multiplied by size.
 */
export const FontFamily = {
  display: {
    400: 'SpaceGrotesk_400Regular',
    500: 'SpaceGrotesk_500Medium',
    600: 'SpaceGrotesk_600SemiBold',
    700: 'SpaceGrotesk_700Bold',
  },
  sans: {
    400: 'IBMPlexSans_400Regular',
    500: 'IBMPlexSans_500Medium',
    600: 'IBMPlexSans_600SemiBold',
    700: 'IBMPlexSans_700Bold',
  },
  mono: {
    400: 'IBMPlexMono_400Regular',
    500: 'IBMPlexMono_500Medium',
    600: 'IBMPlexMono_600SemiBold',
    700: 'IBMPlexMono_700Bold',
  },
} as const;

type Weight = 400 | 500 | 600 | 700;
type Opts = {
  /** Multiple of font size, as in the CSS `size/line-height` shorthand. */
  lh?: number;
  /** Letter spacing in em, as authored in the design. */
  ls?: number;
  color?: string;
  upper?: boolean;
};

function build(family: string, size: number, opts: Opts): TextStyle {
  const style: TextStyle = { fontFamily: family, fontSize: size };
  if (opts.lh != null) style.lineHeight = size * opts.lh;
  if (opts.ls != null) style.letterSpacing = size * opts.ls;
  if (opts.color) style.color = opts.color;
  if (opts.upper) style.textTransform = 'uppercase';
  // Android leaves room for diacritics inside the line box; the design's tight
  // display line-heights need that padding off to land on the same baseline as iOS.
  if (Platform.OS === 'android') style.includeFontPadding = false;
  return style;
}

/** Space Grotesk — display and titles. */
export const display = (size: number, weight: Weight = 700, opts: Opts = {}) =>
  build(FontFamily.display[weight], size, opts);

/** IBM Plex Sans — body and UI. */
export const sans = (size: number, weight: Weight = 400, opts: Opts = {}) =>
  build(FontFamily.sans[weight], size, opts);

/** IBM Plex Mono — labels, metadata and numbers. */
export const mono = (size: number, weight: Weight = 500, opts: Opts = {}) =>
  build(FontFamily.mono[weight], size, opts);

/** The recurring `9.5px mono, .14em, uppercase, fg3` section label. */
export const sectionLabel = (color: string) => mono(9.5, 500, { ls: 0.14, upper: true, color });
