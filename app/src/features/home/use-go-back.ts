import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler } from 'react-native';

/**
 * Goes back. A page opened from Home sits in another tab's stack, so this switches straight to Home instead,
 * fading like any tab, and so does Android's back. Leaving the tab returns it to its first page behind the scenes.
 */
export function useGoBack(openedFromHome: boolean) {
  const router = useRouter();

  const goBack = useCallback(() => {
    if (openedFromHome) {
      router.navigate('/');
    } else {
      router.back();
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
