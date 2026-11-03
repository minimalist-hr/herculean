import { usePreventRemove } from 'expo-router';
import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

import { Button } from './button';
import { Sheet } from './sheet';

/** Asks before leaving a form that has changes, however the user leaves. */
export function useLeaveGuard(dirty: boolean) {
  const [allowed, setAllowed] = useState(false);
  const [asking, setAsking] = useState(false);
  const [repeatLeaving, setRepeatLeaving] = useState<() => void>();
  const [afterAllowed, setAfterAllowed] = useState<() => void>();

  usePreventRemove(dirty && !allowed, ({ repeat }) => {
    // The sheet's button waits behind an open keyboard.
    Keyboard.dismiss();
    setRepeatLeaving(() => repeat);
    setAsking(true);
  });

  // Leaving waits until the screen no longer holds it back.
  useEffect(() => {
    if (allowed) {
      afterAllowed?.();
    }
  }, [afterAllowed, allowed]);

  function leave(go: () => void) {
    setAllowed(true);
    setAfterAllowed(() => go);
  }

  return {
    /** Lets the form close when a save, which takes a while, leaves it. */
    allow: () => {
      setAllowed(true);
    },
    /** Asks again, for when saving failed. */
    block: () => {
      setAllowed(false);
    },
    /** Leaves right now, with what the form has kept. */
    leave,
    sheet: (
      <Sheet
        visible={asking}
        title="Discard changes?"
        message="What you entered here won’t be saved."
        onClose={() => {
          setAsking(false);
        }}
      >
        <Button
          label="Discard changes"
          variant="danger"
          onPress={() => {
            setAsking(false);
            if (repeatLeaving !== undefined) {
              leave(repeatLeaving);
            }
          }}
        />
      </Sheet>
    ),
  };
}
