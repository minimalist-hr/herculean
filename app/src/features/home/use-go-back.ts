import { useRouter } from 'expo-router';

/** Goes back. A page opened from Home sits in another tab's stack, so this also returns to Home. */
export function useGoBack(openedFromHome: boolean) {
  const router = useRouter();

  return () => {
    router.back();
    if (openedFromHome) {
      router.navigate('/');
    }
  };
}
