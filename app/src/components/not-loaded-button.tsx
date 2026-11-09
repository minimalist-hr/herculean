import type { ComponentProps } from 'react';

import { Button } from './button';
import { notifyFailure } from './notifications';

/** An action on a page that hasn't loaded: in its place and muted, and a press says why. */
export function NotLoadedButton({
  label,
  variant,
}: Pick<ComponentProps<typeof Button>, 'label' | 'variant'>) {
  return (
    <Button
      label={label}
      variant={variant}
      muted
      onPress={() => {
        notifyFailure('This page hasn’t loaded yet.');
      }}
    />
  );
}
