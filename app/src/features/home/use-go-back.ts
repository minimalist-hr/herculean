import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler } from 'react-native';

/** Goes back. A page opened from Home sits in another tab's stack, so this also returns to Home, and so does Android's back. */
export function useGoBack(openedFromHome: boolean) {
  const router = useRouter();

  const goBack = useCallback(() => {
    router.back();
    if (openedFromHome) {
      router.navigate('/');
    }
  }, [router, openedFromHome]);

  useFocusEffect(
    useCallback(() => {
      if (!openedFromHome) {
        return undefined;
      }
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          goBack();
          return true;
        },
      );
      return () => {
        subscription.remove();
      };
    }, [openedFromHome, goBack]),
  );

  return goBack;
}
