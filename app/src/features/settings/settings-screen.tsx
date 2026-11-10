import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useIsMutating } from '@tanstack/react-query';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackLink } from '@/components/back-link';
import { ScreenHeading } from '@/components/screen-heading';
import { Skeleton } from '@/components/skeleton';
import { TextLink } from '@/components/text-link';
import { useCurrentUser } from '@/features/account/use-current-user';
import { useWorkoutSettings } from '@/features/workout/use-workout-settings';
import { formatClock, noValue } from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

import { DeleteAccountSheet, SignOutSheet } from './account-sheets';
import {
  colorLabels,
  initialsOf,
  themeLabels,
  unitLabels,
} from './settings-labels';
import { SettingsRow, SettingsSection } from './settings-rows';
import { ProfilePhotoSheet } from './profile-photo-sheet';
import { usePendingEmailChange } from './use-email-change';
import { photoUri, savePhotoKey, useUserPhoto } from './use-user-photo';

/** The user's profile, preferences and account. */
export function SettingsScreen() {
  const router = useRouter();
  const { colors, size, space } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useCurrentUser();
  const workoutSettings = useWorkoutSettings();
  const pendingEmail = usePendingEmailChange();
  const [openSheet, setOpenSheet] = useState<
    'signOut' | 'deleteAccount' | null
  >(null);

  function closeSheet() {
    setOpenSheet(null);
  }

  function userValue(read: (data: NonNullable<typeof user.data>) => string) {
    return user.data === undefined ? undefined : read(user.data);
  }

  function restValue() {
    if (workoutSettings.data !== undefined) {
      return formatClock(workoutSettings.data.defaultRestSeconds);
    }

    return workoutSettings.isLoadingError ? noValue : undefined;
  }

  return (
    <>
      <ScrollView
        style={[styles.screen, { backgroundColor: colors.bg }]}
        contentContainerStyle={{
          gap: space.xl,
          paddingTop: size.topPaddingSubPage,
          paddingHorizontal: size.sidePadding,
          paddingBottom: insets.bottom + space.xl,
        }}
      >
        <View style={{ gap: space.xxxs }}>
          <BackLink
            label="Home"
            onPress={() => {
              router.back();
            }}
          />
          <ScreenHeading title="Settings" />
        </View>

        <Profile name={user.data?.name} email={user.data?.email} />

        <SettingsSection title="Appearance">
          <SettingsRow
            first
            label="Theme"
            value={userValue((data) => themeLabels[data.theme])}
            onPress={() => {
              router.push('/settings/theme');
            }}
          />
          <SettingsRow
            label="Color"
            value={userValue((data) => colorLabels[data.color])}
            onPress={() => {
              router.push('/settings/color');
            }}
          />
        </SettingsSection>

        <SettingsSection title="Workout">
          <SettingsRow
            first
            label="Units"
            value={userValue((data) => unitLabels[data.units])}
            onPress={() => {
              router.push('/settings/units');
            }}
          />
          <SettingsRow
            label="Default rest time"
            value={restValue()}
            onPress={() => {
              router.push('/settings/rest-time');
            }}
          />
        </SettingsSection>

        <SettingsSection title="Account">
          <SettingsRow
            first
            label="Name"
            value={userValue((data) => data.name ?? '')}
            onPress={() => {
              router.push('/settings/name');
            }}
          />
          <SettingsRow
            label="Email"
            value={userValue((data) => data.email)}
            attention={
              pendingEmail.data?.newEmail
                ? 'Waiting for confirmation'
                : undefined
            }
            onPress={() => {
              router.push('/settings/email');
            }}
          />
          <SettingsRow
            label="Password"
            value="Change"
            onPress={() => {
              router.push('/settings/password');
            }}
          />
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsRow
            first
            label="Terms of service"
            hasValue={false}
            onPress={() => {
              router.push({ pathname: '/terms', params: { back: 'Settings' } });
            }}
          />
          <SettingsRow
            label="Privacy policy"
            hasValue={false}
            onPress={() => {
              router.push({
                pathname: '/privacy',
                params: { back: 'Settings' },
              });
            }}
          />
          <SettingsRow
            label="Version"
            value={Constants.expoConfig?.version ?? ''}
          />
        </SettingsSection>

        <SettingsSection>
          <SettingsRow
            first
            label="Sign out"
            hasValue={false}
            action
            onPress={() => {
              setOpenSheet('signOut');
            }}
          />
          <SettingsRow
            label="Delete account"
            hasValue={false}
            action
            danger
            onPress={() => {
              setOpenSheet('deleteAccount');
            }}
          />
        </SettingsSection>
      </ScrollView>
      {/* Outside the scroll view, which would close the keyboard on the first tap of a sheet's button. */}
      <SignOutSheet visible={openSheet === 'signOut'} onClose={closeSheet} />
      <DeleteAccountSheet
        visible={openSheet === 'deleteAccount'}
        onClose={closeSheet}
      />
    </>
  );
}

function Profile({ name, email }: { name?: string | null; email?: string }) {
  const { colors, radius, size, space, text } = useTheme();
  // The link keeps its full touch area, but takes only its text's height, so the name and link fit the avatar.
  const linkOverhang = (size.touchTargetMin - linkTextHeight) / 2;
  const image = useUserPhoto().data?.image;
  const saving = useIsMutating({ mutationKey: savePhotoKey }) > 0;
  const [sheetOpen, setSheetOpen] = useState(false);

  function renderAvatar() {
    if (saving) {
      return <Skeleton width={avatarSize} height={avatarSize} />;
    }
    if (image) {
      return (
        <Image
          accessibilityIgnoresInvertColors
          source={{ uri: photoUri(image) }}
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: radius.control,
          }}
        />
      );
    }
    if (email === undefined) {
      return <Skeleton width={28} height={18} />;
    }

    return (
      <Text style={[text.listItemName, { color: colors.text }]}>
        {initialsOf(name ?? null, email)}
      </Text>
    );
  }

  return (
    <View
      style={[
        styles.profile,
        {
          gap: space.lg,
          padding: space.lg,
          borderRadius: radius.card,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      <View
        style={[
          styles.avatar,
          { borderRadius: radius.control, backgroundColor: colors.raised },
        ]}
      >
        {renderAvatar()}
      </View>
      <View style={[styles.profileText, { gap: space.xs }]}>
        {email === undefined ? (
          <Skeleton width={140} height={18} />
        ) : (
          <Text style={[text.listItemName, { color: colors.text }]}>
            {name ?? email}
          </Text>
        )}
        {/* Its side padding widens the touch area, so it starts in line with the name. */}
        <View style={{ marginLeft: -space.sm, marginVertical: -linkOverhang }}>
          <TextLink
            label={image ? 'Change photo' : 'Add photo'}
            onPress={() => {
              setSheetOpen(true);
            }}
          />
        </View>
      </View>
      <ProfilePhotoSheet
        visible={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
        }}
      />
    </View>
  );
}

const avatarSize = 56;

/** About the height of a text link's 13 px uppercase label. */
const linkTextHeight = 18;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  avatar: {
    width: avatarSize,
    height: avatarSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    flex: 1,
    height: avatarSize,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
});
