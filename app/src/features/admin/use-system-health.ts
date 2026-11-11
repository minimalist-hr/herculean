import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';
import type { components } from '@/api/schema';

export type ServiceHealth = components['schemas']['ServiceHealthResponse'];
export type ServiceStatus = components['schemas']['ServiceStatus'];

export const systemHealthKey = ['admin', 'health'];

/** How often the admin area checks the system while it is open. */
export const healthCheckIntervalMs = 5 * 60 * 1000;

export function useSystemHealth() {
  return useQuery({
    queryKey: systemHealthKey,
    refetchInterval: healthCheckIntervalMs,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/admin/health');
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}

export const serviceStatusLabels: Record<ServiceStatus, string> = {
  working: 'Working',
  slow: 'Slow',
  behind: 'Behind',
  down: 'Down',
};

/** What the services add up to: all working, some needing attention, or some down. */
export function summaryOf(services: ServiceHealth[]) {
  const down = services.filter((service) => service.status === 'down').length;
  const attention = services.filter(
    (service) => service.status === 'slow' || service.status === 'behind',
  ).length;

  if (down > 0) {
    return {
      level: 'down' as const,
      short: `${String(down)} down`,
      long: `${String(down)} down`,
    };
  }
  if (attention > 0) {
    const verb = attention === 1 ? 'needs' : 'need';
    const text = `${String(attention)} ${verb} attention`;
    return { level: 'attention' as const, short: text, long: text };
  }

  return {
    level: 'working' as const,
    short: 'All working',
    long: 'All systems working',
  };
}
