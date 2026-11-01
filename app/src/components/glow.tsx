import { StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '@/theme/theme-provider';

interface GlowProps {
  /** The ellipse's half-width and half-height, as parts of the area, for example 0.7 and 0.55. */
  radiusX: number;
  radiusY: number;
  /** Where along the radius the light has faded out, for example 0.9. */
  fadeAt: number;
}

// Enough stops that the curve between them looks smooth.
const steps = 12;

/** A soft accent light, from the middle of the area outwards. It fills its parent. */
export function Glow({ radiusX, radiusY, fadeAt }: GlowProps) {
  const { colors, opacity } = useTheme();

  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient
          id="glow"
          cx="50%"
          cy="50%"
          rx={`${String(radiusX * 100)}%`}
          ry={`${String(radiusY * 100)}%`}
        >
          {/* The light eases out to nothing. A straight fade shows a ring where it ends.
              The strength goes in stopOpacity: react-native-svg drops the alpha of a stop's color. */}
          {Array.from({ length: steps + 1 }, (_, step) => {
            const along = step / steps;
            return (
              <Stop
                key={step}
                offset={along * fadeAt}
                stopColor={colors.primary}
                stopOpacity={opacity.glow * (1 - smoothstep(along))}
              />
            );
          })}
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#glow)" />
    </Svg>
  );
}

// Starts and ends flat, so neither the middle nor the edge shows a line.
function smoothstep(along: number) {
  return along * along * (3 - 2 * along);
}
