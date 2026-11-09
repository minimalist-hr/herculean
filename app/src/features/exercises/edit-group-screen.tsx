import { FormPage } from '@/components/form-page';
import { LoadFailure } from '@/components/load-failure';

import { DetailsSkeleton } from './exercises-skeleton';
import { GroupFormPage } from './group-form-page';
import { useGroup } from './use-group';
import { useUpdateGroup } from './use-update-group';

const title = 'Edit group';

export function EditGroupScreen({ id }: { id: string }) {
  const group = useGroup(id);
  const updateGroup = useUpdateGroup();

  if (group.data !== undefined) {
    return (
      <GroupFormPage
        back={group.data.name}
        title={title}
        subtitle="The new name shows on every chip and section."
        initialName={group.data.name}
        saving={updateGroup.isPending}
        onSave={(name) => updateGroup.mutateAsync({ id, name })}
        savedMessage={(name) => `${name} saved.`}
      />
    );
  }

  return (
    <FormPage back="Group" title={title}>
      {group.isLoadingError ? (
        <LoadFailure
          message="Couldn’t load this group."
          onRetry={() => {
            void group.refetch();
          }}
        />
      ) : (
        <DetailsSkeleton label="Loading the group" />
      )}
    </FormPage>
  );
}
