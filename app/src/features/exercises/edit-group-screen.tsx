import { FormPage } from '@/components/form-page';
import { LoadFailure } from '@/components/load-failure';
import { NotLoadedButton } from '@/components/not-loaded-button';
import { FieldSkeleton, SkeletonGroup } from '@/components/skeleton';

import { GroupFormPage } from './group-form-page';
import { useGroup } from './use-group';
import { useUpdateGroup } from './use-update-group';

const title = 'Edit group';
const subtitle = 'The new name shows on every chip and section.';

export function EditGroupScreen({ id }: { id: string }) {
  const group = useGroup(id);
  const updateGroup = useUpdateGroup();

  if (group.data !== undefined) {
    return (
      <GroupFormPage
        back={group.data.name}
        title={title}
        subtitle={subtitle}
        initialName={group.data.name}
        saving={updateGroup.isPending}
        onSave={(name) => updateGroup.mutateAsync({ id, name })}
        savedMessage={(name) => `${name} saved.`}
      />
    );
  }

  return (
    <FormPage
      back="Group"
      title={title}
      subtitle={subtitle}
      action={<NotLoadedButton label="Save group" />}
    >
      {group.isLoadingError ? (
        <LoadFailure
          message="Couldn’t load this group."
          onRetry={() => {
            void group.refetch();
          }}
        />
      ) : (
        <SkeletonGroup label="Loading the group">
          <FieldSkeleton label="Name" />
        </SkeletonGroup>
      )}
    </FormPage>
  );
}
