import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  color: ColorValue;
  size?: number;
}

function Icon({
  color,
  size = 22,
  strokeWidth = 1.75,
  children,
}: IconProps & { strokeWidth?: number; children: React.ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="square"
    >
      {children}
    </Svg>
  );
}

export function HomeIcon({ color, size }: IconProps) {
  return (
    <Icon color={color} size={size}>
      <Path d="M4 10.5L12 4l8 6.5v10h-5.5v-6h-5v6H4z" />
    </Icon>
  );
}

export function WorkoutIcon({ color, size }: IconProps) {
  return (
    <Icon color={color} size={size}>
      <Path d="M6 7v10M18 7v10M3 9.5v5M21 9.5v5M6 12h12" />
    </Icon>
  );
}

export function RoutinesIcon({ color, size }: IconProps) {
  return (
    <Icon color={color} size={size}>
      <Path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
    </Icon>
  );
}

export function ExercisesIcon({ color, size }: IconProps) {
  return (
    <Icon color={color} size={size}>
      {/* Four 7 px squares with 0.5 px corners. */}
      <Path d="M4.5 4h6a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-.5.5h-6a.5.5 0 0 1-.5-.5v-6a.5.5 0 0 1 .5-.5z" />
      <Path d="M13.5 4h6a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-.5.5h-6a.5.5 0 0 1-.5-.5v-6a.5.5 0 0 1 .5-.5z" />
      <Path d="M4.5 13h6a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-.5.5h-6a.5.5 0 0 1-.5-.5v-6a.5.5 0 0 1 .5-.5z" />
      <Path d="M13.5 13h6a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-.5.5h-6a.5.5 0 0 1-.5-.5v-6a.5.5 0 0 1 .5-.5z" />
    </Icon>
  );
}

export function EyeIcon({ color, size }: IconProps) {
  return (
    <Icon color={color} size={size}>
      <Path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <Path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
    </Icon>
  );
}

export function EyeOffIcon({ color, size }: IconProps) {
  return (
    <Icon color={color} size={size}>
      <Path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <Path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
      <Path d="M4 4l16 16" />
    </Icon>
  );
}

export function ChevronLeftIcon({ color, size }: IconProps) {
  return (
    <Icon color={color} size={size}>
      <Path d="M15 5l-7 7 7 7" />
    </Icon>
  );
}

/** A quarter-open circle. The spinner turns it. */
export function SpinnerArcIcon({ color, size }: IconProps) {
  return (
    <Icon color={color} size={size} strokeWidth={2}>
      <Path d="M12 3a9 9 0 1 0 9 9" />
    </Icon>
  );
}
