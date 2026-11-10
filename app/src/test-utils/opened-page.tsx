import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';

/** A page a link opened, which says what opened it. */
export function OpenedPage() {
  const { from } = useLocalSearchParams<{ from?: string }>();

  return <Text>{`Opened from ${String(from)}`}</Text>;
}
