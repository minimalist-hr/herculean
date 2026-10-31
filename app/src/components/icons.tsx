import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  color: ColorValue;
  size?: number;
}

function Icon({
  color,
  size = 22,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.75}
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
