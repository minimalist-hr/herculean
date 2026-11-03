import { EmptyCard } from '@/components/empty-card';

/** Stands where sessions and progress show once there are some. */
export function NoSessionsCard({ message }: { message: string }) {
  return <EmptyCard title="No sessions yet" message={message} />;
}
