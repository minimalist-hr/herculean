import { rememberCreatedGroup } from './created-group';
import { GroupFormPage } from './group-form-page';
import { useCreateGroup } from './use-create-group';

/** Starts from what the user was searching for, if anything. */
export function NewGroupScreen({
  initialName = '',
  back = 'Groups',
  pick = false,
}: {
  initialName?: string;
  /** The screen its back link returns to. */
  back?: string;
  /** Opened from a picker, which selects the new group on the way back. */
  pick?: boolean;
}) {
  const createGroup = useCreateGroup();

  return (
    <GroupFormPage
      back={back}
      title="New group"
      subtitle="It’s added at the end of your groups and chips."
      initialName={initialName}
      saving={createGroup.isPending}
      onSave={async (name) => {
        const group = await createGroup.mutateAsync(name);
        if (pick) {
          rememberCreatedGroup(group.id);
        }

        return group;
      }}
      savedMessage={(name) => `${name} created.`}
    />
  );
}
