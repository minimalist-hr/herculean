import { useLocalSearchParams, useRouter } from 'expo-router';

import { AdminListPage } from './admin-list-page';
import {
  useCreateSavedReply,
  useDeleteSavedReply,
  useSavedReplies,
  useUpdateSavedReply,
} from './use-saved-replies';
import { SavedReplyForm } from './saved-reply-form';

const maxSavedReplies = 50;

/** The saved replies every admin can pick on a ticket. */
export function SavedRepliesScreen() {
  const router = useRouter();
  const replies = useSavedReplies();
  const full = (replies.data?.length ?? 0) >= maxSavedReplies;

  return (
    <AdminListPage
      back="Settings"
      title="Saved replies"
      subtitle="Answers you send often."
      rows={replies.data?.map((reply) => ({
        id: reply.id,
        title: reply.title,
        detail: reply.text,
      }))}
      failed={replies.isLoadingError}
      onRetry={() => {
        void replies.refetch();
      }}
      failureMessage="Couldn’t load saved replies."
      loadingLabel="Loading saved replies"
      empty={{
        title: 'No saved replies',
        message: 'Add one to answer faster.',
      }}
      onOpen={(id) => {
        router.push({
          pathname: '/admin/settings/saved-replies/[id]',
          params: { id },
        });
      }}
      newButton={{
        label: 'New saved reply',
        mutedReason: full ? 'At most 50 saved replies.' : undefined,
        onPress: () => {
          router.push('/admin/settings/saved-replies/new');
        },
      }}
    />
  );
}

export function NewSavedReplyScreen() {
  const create = useCreateSavedReply();

  return (
    <SavedReplyForm
      title="New saved reply"
      initial={{ title: '', text: '' }}
      saving={create.isPending}
      onSave={(draft) => create.mutateAsync(draft)}
      savedMessage="Saved reply added."
    />
  );
}

export function EditSavedReplyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const replies = useSavedReplies();
  const update = useUpdateSavedReply(id);
  const remove = useDeleteSavedReply(id);
  const reply = replies.data?.find((saved) => saved.id === id);

  // It opens from the list, so the reply is already read; a missing one is gone.
  if (reply === undefined) {
    return null;
  }

  return (
    <SavedReplyForm
      title="Edit saved reply"
      initial={{ title: reply.title, text: reply.text }}
      saving={update.isPending}
      onSave={(draft) => update.mutateAsync(draft)}
      savedMessage="Saved reply changed."
      remove={{
        label: 'Delete saved reply',
        title: 'Delete this saved reply?',
        message: 'It’s gone for good.',
        deleting: remove.isPending,
        onDelete: () => remove.mutateAsync(),
        deletedMessage: 'Saved reply deleted.',
        failureMessage: 'Couldn’t delete the reply. Try again.',
      }}
    />
  );
}
