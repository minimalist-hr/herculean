import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { Button } from './button';
import { HeaderIconButton } from './header-icon-button';
import { TrashIcon } from './icons';
import { notifyFailure, notifySuccess } from './notifications';
import { Sheet } from './sheet';

/** A delete on a page: a trash icon beside the title that asks first on a sheet. */
export interface FormDelete {
  /** The trash icon's label for screen readers. */
  label: string;
  title: string;
  message: string;
  /** Why it can't be deleted yet. The trash looks muted and tapping it says why. */
  mutedReason?: string;
  deleting: boolean;
  onDelete: () => Promise<unknown>;
  deletedMessage: string;
  failureMessage: string;
}

/** Lets a page with changes close when deleting leaves it, and asks again if deleting failed. */
interface LeaveGuard {
  allow: () => void;
  block: () => void;
}

/** The trash icon for the header and its sheet. Deleting leaves the page. */
export function useFormDelete(
  remove: FormDelete | undefined,
  guard?: LeaveGuard,
) {
  const router = useRouter();
  const { colors, opacity } = useTheme();
  const [confirming, setConfirming] = useState(false);

  if (remove === undefined) {
    return { headerAction: undefined, sheet: null };
  }

  const muted = remove.mutedReason !== undefined;

  async function confirm(deleting: FormDelete) {
    guard?.allow();
    try {
      await deleting.onDelete();
      setConfirming(false);
      notifySuccess(deleting.deletedMessage);
      router.back();
    } catch {
      guard?.block();
      notifyFailure(deleting.failureMessage);
    }
  }

  return {
    headerAction: (
      <HeaderIconButton
        label={muted ? `${remove.label}, not available` : remove.label}
        onPress={() => {
          if (remove.mutedReason === undefined) {
            setConfirming(true);
          } else {
            notifyFailure(remove.mutedReason);
          }
        }}
      >
        <View style={{ opacity: muted ? opacity.disabled : 1 }}>
          <TrashIcon
            color={muted ? colors.muted : colors.dangerFill}
            size={20}
          />
        </View>
      </HeaderIconButton>
    ),
    sheet: (
      <Sheet
        visible={confirming}
        title={remove.title}
        message={remove.message}
        onClose={() => {
          setConfirming(false);
        }}
      >
        <Button
          label="Delete"
          waitingLabel="Deleting"
          variant="danger"
          waiting={remove.deleting}
          onPress={() => void confirm(remove)}
        />
      </Sheet>
    ),
  };
}
