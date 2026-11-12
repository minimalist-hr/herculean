import { useState } from 'react';
import { RefreshControl } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/** Pulling down reads the page again, with the phone's own spinner. Pass it as a scroll view's refreshControl. */
export function usePullToRefresh(refresh: () => Promise<unknown>) {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  async function pullToRefresh() {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={() => {
        void pullToRefresh();
      }}
      tintColor={colors.primaryText}
      colors={[colors.primary]}
      progressBackgroundColor={colors.raised}
    />
  );
}
