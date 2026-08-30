import React from 'react';
import Svg, { Circle, Line, Path } from 'react-native-svg';

/**
 * Hand-drawn geometric strokes from the design — 1.6–1.8 stroke at 21px.
 * `color` is passed explicitly rather than inherited so these work inside
 * accent-filled surfaces as well as on `bg`.
 */
type IconProps = { size?: number; color: string };

export function DiscoverIcon({ size = 21, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 21 21" fill="none">
      <Circle cx="10.5" cy="10.5" r="8" stroke={color} strokeWidth={1.6} />
      <Circle cx="10.5" cy="10.5" r="2.6" fill={color} />
    </Svg>
  );
}

export function SearchIcon({ size = 21, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 21 21" fill="none">
      <Circle cx="9" cy="9" r="6.4" stroke={color} strokeWidth={1.6} />
      <Line x1="13.8" y1="13.8" x2="18.5" y2="18.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function ListIcon({ size = 21, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 21 21" fill="none">
      <Line x1="3" y1="5.5" x2="18" y2="5.5" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Line x1="3" y1="10.5" x2="18" y2="10.5" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Line x1="3" y1="15.5" x2="12" y2="15.5" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

export function SocialIcon({ size = 21, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 21 21" fill="none">
      <Circle cx="7.5" cy="10.5" r="5.2" stroke={color} strokeWidth={1.6} />
      <Circle cx="14" cy="10.5" r="5.2" stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

export function ProfileIcon({ size = 21, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 21 21" fill="none">
      <Circle cx="10.5" cy="7" r="3.6" stroke={color} strokeWidth={1.6} />
      <Path
        d="M3.6 18.2c1-3.6 3.7-5.4 6.9-5.4s5.9 1.8 6.9 5.4"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function BellIcon({ size = 15, color, dot }: IconProps & { dot?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 15 15" fill="none">
      <Path
        d="M7.5 2c-2 0-3.4 1.5-3.4 3.4 0 3-1.3 4-1.3 4h9.4s-1.3-1-1.3-4C10.9 3.5 9.5 2 7.5 2z"
        stroke={color}
        strokeWidth={1.3}
        strokeLinejoin="round"
      />
      {dot ? <Circle cx="11.4" cy="3.2" r="2.2" fill={dot} /> : null}
    </Svg>
  );
}

export function GearIcon({ size = 16, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Circle cx="8" cy="8" r="2.6" stroke={color} strokeWidth={1.4} />
      <Circle cx="8" cy="8" r="6.2" stroke={color} strokeWidth={1.4} strokeDasharray="2.2 2.6" />
    </Svg>
  );
}

export function MagnifierIcon({ size = 15, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 15 15" fill="none">
      <Circle cx="6.5" cy="6.5" r="4.6" stroke={color} strokeWidth={1.4} />
      <Line x1="10" y1="10" x2="13.2" y2="13.2" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}
