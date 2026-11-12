import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { usePageEnd } from '@/components/above-tab-bar';
import { BackLink } from '@/components/back-link';
import { EmptyCard } from '@/components/empty-card';
import { ChevronRightIcon } from '@/components/icons';
import { ListCard } from '@/components/list-card';
import { LoadFailure } from '@/components/load-failure';
import { NewButton, useNewButtonRoom } from '@/components/new-button';
import { dismissNotification, notifyFailure } from '@/components/notifications';
import { ScreenHeading } from '@/components/screen-heading';
import { Skeleton } from '@/components/skeleton';
import { Tappable } from '@/components/tappable';
import { useTheme } from '@/theme/theme-provider';

/** A row of the list: a title, and one line below it. */
export interface AdminListRow {
  id: string;
  title: string;
  detail: string;
}

interface AdminListPageProps {
  /** The screen its back link returns to. */
  back: string;
  title: string;
  subtitle: string;
  /** Undefined while the list loads or after it failed. */
  rows: readonly AdminListRow[] | undefined;
  failed: boolean;
  onRetry: () => void;
  failureMessage: string;
  loadingLabel: string;
  empty: { title: string; message: string };
  onOpen: (id: string) => void;
  newButton: {
    label: string;
    /** Why nothing can be added now. The button looks muted and says why. */
    mutedReason?: string;
    onPress: () => void;
  };
}

/** A settings page listing what admins keep, one card of rows, with New floating at the bottom right. */
export function AdminListPage({
  back,
  title,
  subtitle,
  rows,
  failed,
  onRetry,
  failureMessage,
  loadingLabel,
  empty,
  onOpen,
  newButton,
}: AdminListPageProps) {
  const router = useRouter();
  const { colors, size, space, text } = useTheme();
  const pageEnd = usePageEnd();
  const newButtonRoom = useNewButtonRoom();

  function rowStyle(index: number) {
    return {
      minHeight: size.optionRowMin,
      paddingVertical: space.md,
      paddingHorizontal: space.lg,
      borderTopWidth: index === 0 ? 0 : 1,
      borderTopColor: colors.border,
    };
  }

  function renderList() {
    if (rows !== undefined) {
      if (rows.length === 0) {
        return <EmptyCard title={empty.title} message={empty.message} />;
      }

      return (
        <ListCard>
          {rows.map((row, index) => (
            <Tappable
              key={row.id}
              feedback="fill"
              accessibilityRole="button"
              accessibilityLabel={row.title}
              onPress={() => {
                onOpen(row.id);
              }}
              style={[styles.row, { gap: space.md }, rowStyle(index)]}
            >
              <View style={[styles.summary, { gap: space.xxs }]}>
                <Text style={[text.listItemName, { color: colors.text }]}>
                  {row.title}
                </Text>
                <Text numberOfLines={1} style={text.meta}>
                  {row.detail}
                </Text>
              </View>
              <ChevronRightIcon color={colors.muted} size={16} />
            </Tappable>
          ))}
        </ListCard>
      );
    }

    if (failed) {
      return <LoadFailure message={failureMessage} onRetry={onRetry} />;
    }

    return (
      <View accessible accessibilityLabel={loadingLabel}>
        <ListCard>
          {[100, 80].map((width, index) => (
            <View key={index} style={[{ gap: space.xs }, rowStyle(index)]}>
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
            label={back}
            onPress={() => {
              router.back();
            }}
          />
          <ScreenHeading title={title} subtitle={subtitle} />
        </View>
        {renderList()}
      </ScrollView>
      <NewButton
        label={newButton.label}
        muted={newButton.mutedReason !== undefined}
        onPress={() => {
          if (newButton.mutedReason !== undefined) {
            notifyFailure(newButton.mutedReason);
            return;
          }

          dismissNotification();
          newButton.onPress();
        }}
      />
    </View>
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
