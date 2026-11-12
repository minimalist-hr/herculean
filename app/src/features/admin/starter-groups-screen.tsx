import { useLocalSearchParams, useRouter } from 'expo-router';

import { GroupFormPage } from '@/features/exercises/group-form-page';
import { countOf } from '@/features/exercises/groups-list';

import { AdminListPage } from './admin-list-page';
import {
  maxStarterGroups,
  useCreateStarterGroup,
  useRenameStarterGroup,
  useStarterGroups,
} from './use-starter-content';

const nameTakenCode = 'starter_group.name_taken';

/** The groups every new account starts with, in their order. */
export function StarterGroupsScreen() {
  const router = useRouter();
  const groups = useStarterGroups();
  const full = (groups.data?.length ?? 0) >= maxStarterGroups;

  return (
    <AdminListPage
      back="Starter exercises"
      title="Starter groups"
      subtitle="Groups new accounts start with."
      rows={groups.data?.map((group) => ({
        id: group.id,
        title: group.name,
        detail: countOf(group),
      }))}
      failed={groups.isLoadingError}
      onRetry={() => {
        void groups.refetch();
      }}
      failureMessage="Couldn’t load starter groups."
      loadingLabel="Loading starter groups"
      empty={{
        title: 'No starter groups',
        message: 'Add one to sort starter exercises.',
      }}
      onOpen={(id) => {
        router.push({
          pathname: '/admin/settings/starter/groups/[id]',
          params: { id },
        });
      }}
      newButton={{
        label: 'New starter group',
        mutedReason: full ? 'At most 50 starter groups.' : undefined,
        onPress: () => {
          router.push('/admin/settings/starter/groups/new');
        },
      }}
    />
  );
}

export function NewStarterGroupScreen() {
  const create = useCreateStarterGroup();

  return (
    <GroupFormPage
      back="Starter groups"
      title="New starter group"
      subtitle="It’s added at the end of the starter groups."
      initialName=""
      nameTakenCode={nameTakenCode}
      saving={create.isPending}
      onSave={async (name) => {
        await create.mutateAsync(name);

        return { name: name.trim() };
      }}
      savedMessage={(name) => `${name} created.`}
    />
  );
}

export function EditStarterGroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const groups = useStarterGroups();
  const rename = useRenameStarterGroup(id);
  const group = groups.data?.find((saved) => saved.id === id);

  // It opens from the list, so the group is already read; a missing one is gone.
  if (group === undefined) {
    return null;
  }

  return (
    <GroupFormPage
      back={group.name}
      title="Edit starter group"
      initialName={group.name}
      nameTakenCode={nameTakenCode}
      saving={rename.isPending}
      onSave={async (name) => {
        await rename.mutateAsync(name);

        return { name: name.trim() };
      }}
      savedMessage={(name) => `${name} saved.`}
    />
  );
}
