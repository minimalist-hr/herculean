import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { EmptyCard } from '@/components/empty-card';
import { HeaderIconButton } from '@/components/header-icon-button';
import { FeedbackIcon } from '@/components/icons';
import { ListCard } from '@/components/list-card';
import { LoadFailure } from '@/components/load-failure';
import { Sheet } from '@/components/sheet';
import { Skeleton } from '@/components/skeleton';
import { Tappable } from '@/components/tappable';
import { useTheme } from '@/theme/theme-provider';

import { fillName, useSavedReplies } from './use-saved-replies';

/** The reply box's Saved replies button, and the sheet it opens. Picking one puts it in the reply. */
export function SavedRepliesButton({
  name,
  onPick,
}: {
  /** The user's name, which {name} becomes. Null without one. */
  name: string | null;
  onPick: (text: string) => void;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <HeaderIconButton
        label="Saved replies"
        onPress={() => {
          setOpen(true);
        }}
      >
        <FeedbackIcon color={colors.text} size={20} />
      </HeaderIconButton>
      <Sheet
        visible={open}
        title="Saved replies"
        onClose={() => {
          setOpen(false);
        }}
        body={
          open ? (
            <SavedReplyChoices
              onPick={(text) => {
                setOpen(false);
                onPick(fillName(text, name));
              }}
            />
          ) : null
        }
      />
    </>
  );
}

function SavedReplyChoices({ onPick }: { onPick: (text: string) => void }) {
  const { colors, size, space, text } = useTheme();
  const replies = useSavedReplies();

  if (replies.data !== undefined) {
    if (replies.data.length === 0) {
      return (
        <EmptyCard title="No saved replies" message="Add them in Settings." />
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
              onPick(reply.text);
            }}
            style={{
              gap: space.xxs,
              minHeight: size.optionRowMin,
              justifyContent: 'center',
              paddingVertical: space.md,
              paddingHorizontal: space.lg,
              borderTopWidth: index === 0 ? 0 : 1,
              borderTopColor: colors.border,
            }}
          >
            <Text style={[text.listItemName, { color: colors.text }]}>
              {reply.title}
            </Text>
            <Text numberOfLines={1} style={text.meta}>
              {reply.text}
            </Text>
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
    <View
      accessible
      accessibilityLabel="Loading saved replies"
      style={[styles.skeleton, { gap: space.sm }]}
    >
      <Skeleton width={120} height={16} />
      <Skeleton width={220} height={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    alignItems: 'flex-start',
  },
});
