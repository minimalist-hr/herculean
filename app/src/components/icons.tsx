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

export function GroupsIcon({ color, size }: IconProps) {
  return (
    <Icon color={color} size={size}>
      <Path d="M12 3.5l8.5 4.5-8.5 4.5L3.5 8z" />
      <Path d="M3.5 12.5l8.5 4.5 8.5-4.5" />
      <Path d="M3.5 16.5l8.5 4.5 8.5-4.5" />
    </Icon>
  );
}

export function SearchIcon({ color, size }: IconProps) {
  return (
    <Icon color={color} size={size} strokeWidth={2}>
      <Path d="M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L20 20" />
    </Icon>
  );
}

export function CloseIcon({ color, size }: IconProps) {
  return (
    <Icon color={color} size={size} strokeWidth={2}>
      <Path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  );
}

export function ChevronRightIcon({ color, size }: IconProps) {
  return (
    <Icon color={color} size={size} strokeWidth={2}>
      <Path d="M9 6l6 6-6 6" />
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

export function CheckIcon({ color, size }: IconProps) {
  return (
    <Icon color={color} size={size}>
      <Path d="M5 12.5l4.5 4.5L19 7.5" />
    </Icon>
  );
}

export function AlertIcon({ color, size }: IconProps) {
  return (
    <Icon color={color} size={size}>
      <Path d="M12 7v6M12 16.5v.5M12 3l10 18H2z" />
    </Icon>
  );
}

export function TrashIcon({ color, size }: IconProps) {
  return (
    <Icon color={color} size={size}>
      <Path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
    </Icon>
  );
}

export function PencilIcon({ color, size }: IconProps) {
  return (
    <Icon color={color} size={size}>
      <Path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />
    </Icon>
  );
}

export function HistoryIcon({ color, size }: IconProps) {
  return (
    <Icon color={color} size={size} strokeWidth={1.6}>
      <Path d="M3.5 12a8.5 8.5 0 1 0 2.5-6M3.5 4v4h4M12 7.5V12l3 2" />
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

export function MinusIcon({ color, size }: IconProps) {
  return (
    <Icon color={color} size={size} strokeWidth={2}>
      <Path d="M5 12h14" />
    </Icon>
  );
}

export function PlusIcon({ color, size }: IconProps) {
  return (
    <Icon color={color} size={size} strokeWidth={2}>
      <Path d="M12 5v14M5 12h14" />
    </Icon>
  );
}
