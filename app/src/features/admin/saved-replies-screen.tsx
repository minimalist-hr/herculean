import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackLink } from '@/components/back-link';
import { EmptyCard } from '@/components/empty-card';
import { ChevronRightIcon } from '@/components/icons';
import { ListCard } from '@/components/list-card';
import { LoadFailure } from '@/components/load-failure';
import { NewButton, useNewButtonRoom } from '@/components/new-button';
import { dismissNotification, notifyFailure } from '@/components/notifications';
import { usePageEnd } from '@/components/above-tab-bar';
import { ScreenHeading } from '@/components/screen-heading';
import { Skeleton } from '@/components/skeleton';
import { Tappable } from '@/components/tappable';
import { useTheme } from '@/theme/theme-provider';

import {
  useCreateSavedReply,
  useDeleteSavedReply,
  useSavedReplies,
  useUpdateSavedReply,
} from './use-saved-replies';
import { SavedReplyForm } from './saved-reply-form';

const maxSavedReplies = 50;

/** The saved replies every admin can pick on a ticket. */
export function SavedRepliesScreen() {
  const router = useRouter();
  const { colors, size, space, text } = useTheme();
  const pageEnd = usePageEnd();
  const newButtonRoom = useNewButtonRoom();
  const replies = useSavedReplies();
  const full = (replies.data?.length ?? 0) >= maxSavedReplies;

  function renderList() {
    if (replies.data !== undefined) {
      if (replies.data.length === 0) {
        return (
          <EmptyCard
            title="No saved replies"
            message="Add one to answer faster."
          />
        );
      }

      return (
        <ListCard>
          {replies.data.map((reply, index) => (
            <Tappable
              key={reply.id}
              feedback="fill"
              accessibilityRole="button"
              accessibilityLabel={reply.title}
              onPress={() => {
                router.push({
                  pathname: '/admin/settings/saved-replies/[id]',
                  params: { id: reply.id },
                });
              }}
              style={[
                styles.row,
                {
                  gap: space.md,
                  minHeight: size.optionRowMin,
                  paddingVertical: space.md,
                  paddingHorizontal: space.lg,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: colors.border,
                },
              ]}
            >
              <View style={[styles.summary, { gap: space.xxs }]}>
                <Text style={[text.listItemName, { color: colors.text }]}>
                  {reply.title}
                </Text>
                <Text numberOfLines={1} style={text.meta}>
                  {reply.text}
                </Text>
              </View>
              <ChevronRightIcon color={colors.muted} size={16} />
            </Tappable>
          ))}
        </ListCard>
      );
    }

    if (replies.isLoadingError) {
      return (
        <LoadFailure
          message="Couldn’t load saved replies."
          onRetry={() => {
            void replies.refetch();
          }}
        />
      );
    }

    return (
      <View accessible accessibilityLabel="Loading saved replies">
        <ListCard>
          {[100, 80].map((width, index) => (
            <View
              key={index}
              style={{
                gap: space.xs,
                minHeight: size.optionRowMin,
                paddingVertical: space.md,
                paddingHorizontal: space.lg,
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: colors.border,
              }}
            >
              <Skeleton width={width} height={16} />
              <Skeleton width={200} height={12} />
            </View>
          ))}
        </ListCard>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={{
          gap: space.xl,
          paddingTop: size.topPaddingSubPage,
          paddingHorizontal: size.sidePadding,
          paddingBottom: pageEnd + newButtonRoom,
        }}
      >
        <View style={{ gap: space.xxxs }}>
          <BackLink
            label="Settings"
            onPress={() => {
              router.back();
            }}
          />
          <ScreenHeading
            title="Saved replies"
            subtitle="Answers you send often."
          />
        </View>
        {renderList()}
      </ScrollView>
      <NewButton
        label="New saved reply"
        muted={full}
        onPress={() => {
          if (full) {
            notifyFailure('At most 50 saved replies.');
            return;
          }

          dismissNotification();
          router.push('/admin/settings/saved-replies/new');
        }}
      />
    </View>
  );
}

export function NewSavedReplyScreen() {
  const create = useCreateSavedReply();

  return (
    <SavedReplyForm
      title="New saved reply"
      initial={{ title: '', text: '' }}
      saving={create.isPending}
      onSave={(draft) => create.mutateAsync(draft)}
      savedMessage="Saved reply added."
    />
  );
}

export function EditSavedReplyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const replies = useSavedReplies();
  const update = useUpdateSavedReply(id);
  const remove = useDeleteSavedReply(id);
  const reply = replies.data?.find((saved) => saved.id === id);

  // It opens from the list, so the reply is already read; a missing one is gone.
  if (reply === undefined) {
    return null;
  }

  return (
    <SavedReplyForm
      title="Edit saved reply"
      initial={{ title: reply.title, text: reply.text }}
      saving={update.isPending}
      onSave={(draft) => update.mutateAsync(draft)}
      savedMessage="Saved reply changed."
      remove={{
        deleting: remove.isPending,
        onDelete: () => remove.mutateAsync(),
      }}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summary: {
    flex: 1,
  },
});
