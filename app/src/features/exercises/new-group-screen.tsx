import { GroupFormPage } from './group-form-page';
import { useCreateGroup } from './use-create-group';

/** Starts from what the user was searching for, if anything. */
export function NewGroupScreen({ initialName = '' }: { initialName?: string }) {
  const createGroup = useCreateGroup();

  return (
    <GroupFormPage
      back="Groups"
      title="New group"
      subtitle="It’s added at the end of your groups and chips."
      initialName={initialName}
      saving={createGroup.isPending}
      onSave={(name) => createGroup.mutateAsync(name)}
      savedMessage={(name) => `${name} created.`}
    />
  );
}
