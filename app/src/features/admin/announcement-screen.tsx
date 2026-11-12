import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/button';
import { FormPage } from '@/components/form-page';
import { HeaderIconButton } from '@/components/header-icon-button';
import { TrashIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import { NotLoadedButton } from '@/components/not-loaded-button';
import {
  afterSheetsClose,
  notifyFailure,
  notifySuccess,
} from '@/components/notifications';
import { Sheet } from '@/components/sheet';
import { FieldSkeleton } from '@/components/skeleton';
import { useLeaveGuard } from '@/components/use-leave-guard';
import { AnnouncementView } from '@/features/announcement/announcement-card';
import {
  textMaxLength,
  titleMaxLength,
  useAdminAnnouncement,
  useRemoveAnnouncement,
  useSaveAnnouncement,
  type Announcement,
} from '@/features/announcement/use-announcement';
import { useTheme } from '@/theme/theme-provider';
import { showSaveFailure, TitleTextFields } from './title-text-fields';

const pageTitle = 'Announcement';
const pageSubtitle = 'Shown on everyone’s Home until you remove it.';

const announcementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Enter a title.')
    .max(titleMaxLength, 'At most 60 characters.'),
  text: z
    .string()
    .trim()
    .min(1, 'Write the announcement.')
    .max(textMaxLength, 'At most 300 characters.'),
});

/** The announcement on everyone's Home: write it, see how it looks, or remove it. */
export function AnnouncementScreen() {
  const announcement = useAdminAnnouncement();

  if (announcement.data === undefined) {
    return (
      <FormPage
        back="Settings"
        title={pageTitle}
        subtitle={pageSubtitle}
        action={<NotLoadedButton label="Save announcement" />}
      >
        {announcement.isLoadingError ? (
          <LoadFailure
            message="Couldn’t load the announcement."
            onRetry={() => {
              void announcement.refetch();
            }}
          />
        ) : (
          <>
            <FieldSkeleton label="Title" />
            <FieldSkeleton label="Text" />
          </>
        )}
      </FormPage>
    );
  }

  return <AnnouncementForm current={announcement.data} />;
}

function AnnouncementForm({ current }: { current: Announcement | null }) {
  const router = useRouter();
  const { colors, space, text } = useTheme();
  const save = useSaveAnnouncement();
  const remove = useRemoveAnnouncement();
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const { control, handleSubmit, setError, formState } = useForm({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: current?.title ?? '', text: current?.text ?? '' },
  });
  const typed = useWatch({ control });
  const guard = useLeaveGuard(formState.isDirty);

  const submit = handleSubmit(async (draft) => {
    guard.allow();
    try {
      await save.mutateAsync(draft);
      notifySuccess('Announcement on Home.');
      router.back();
    } catch (error) {
      guard.block();
      showSaveFailure(
        error,
        setError,
        'Couldn’t save the announcement. Try again.',
      );
    }
  });

  async function confirmRemove() {
    guard.allow();
    try {
      await remove.mutateAsync();
      setConfirmingRemove(false);
      notifySuccess('Announcement removed.');
      afterSheetsClose(() => {
        router.back();
      });
    } catch {
      guard.block();
      notifyFailure('Couldn’t remove the announcement. Try again.');
    }
  }

  return (
    <>
      <FormPage
        back="Settings"
        title={pageTitle}
        subtitle={pageSubtitle}
        headerAction={
          current === null ? undefined : (
            <HeaderIconButton
              label="Remove the announcement"
              onPress={() => {
                setConfirmingRemove(true);
              }}
            >
              <TrashIcon color={colors.dangerFill} size={20} />
            </HeaderIconButton>
          )
        }
        action={
          <Button
            label="Save announcement"
            waitingLabel="Saving announcement"
            waiting={save.isPending}
            onPress={() => void submit()}
          />
        }
      >
        <TitleTextFields
          control={control}
          errors={formState.errors}
          titleMaxLength={titleMaxLength}
          textMaxLength={textMaxLength}
        />
        <View style={{ gap: space.sm }}>
          <Text style={text.meta}>Shows on Home like this</Text>
          <AnnouncementView
            title={orPlaceholder(typed.title, 'Title')}
            text={orPlaceholder(typed.text, 'Your announcement.')}
          />
        </View>
      </FormPage>
      {current !== null && (
        <Sheet
          visible={confirmingRemove}
          title="Remove the announcement?"
          message="It goes from everyone’s Home."
          onClose={() => {
            setConfirmingRemove(false);
          }}
        >
          <Button
            label="Remove"
            waitingLabel="Removing"
            variant="danger"
            waiting={remove.isPending}
            onPress={() => void confirmRemove()}
          />
        </Sheet>
      )}
      {guard.sheet}
    </>
  );
}

/** What the preview shows: what is typed, or a placeholder before anything is. */
function orPlaceholder(typed: string | undefined, placeholder: string) {
  const trimmed = typed?.trim() ?? '';
  return trimmed === '' ? placeholder : trimmed;
}
