import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { TrashIcon } from '@/components/icons';
import { dismissNotification, notifyFailure } from '@/components/notifications';
import { RadioCard } from '@/components/radio-card';
import { SectionTitle } from '@/components/section-title';
import { Sheet } from '@/components/sheet';
import { Tappable } from '@/components/tappable';
import {
  SettingsRow,
  SettingsSection,
} from '@/features/settings/settings-rows';
import { formatDateTime } from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

import {
  useDeleteNote,
  useUpdatePriority,
  type TicketNote,
  type TicketPriority,
} from './use-ticket-tools';

const priorityLabels: Record<TicketPriority, string> = {
  normal: 'Normal',
  high: 'High',
};

/** A ticket's priority as a row, and the sheet that changes it at once. */
export function PrioritySection({
  ticketId,
  priority,
}: {
  ticketId: string;
  priority: TicketPriority;
}) {
  const update = useUpdatePriority(ticketId);
  const [open, setOpen] = useState(false);

  async function pick(next: TicketPriority) {
    setOpen(false);
    if (next === priority) {
      return;
    }

    dismissNotification();
    try {
      await update.mutateAsync(next);
    } catch {
      notifyFailure('Couldn’t change the priority. Try again.');
    }
  }

  return (
    <>
      <SettingsSection>
        <SettingsRow
          first
          label="Priority"
          value={priorityLabels[priority]}
          onPress={() => {
            dismissNotification();
            setOpen(true);
          }}
        />
      </SettingsSection>
      <Sheet
        visible={open}
        title="Priority"
        onClose={() => {
          setOpen(false);
        }}
        body={(['normal', 'high'] as const).map((choice) => (
          <RadioCard
            key={choice}
            label={priorityLabels[choice]}
            detail={choice === 'high' ? 'Comes first in the inbox.' : undefined}
            selected={priority === choice}
            onSelect={() => void pick(choice)}
          />
        ))}
      />
    </>
  );
}

/** Notes only admins see, oldest first, with Add note and a delete that asks first. */
export function NotesSection({
  ticketId,
  notes,
  onAdd,
}: {
  ticketId: string;
  notes: TicketNote[];
  onAdd: () => void;
}) {
  const { space } = useTheme();
  const deleteNote = useDeleteNote(ticketId);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function confirmDelete() {
    if (deleting === null) {
      return;
    }

    dismissNotification();
    try {
      await deleteNote.mutateAsync(deleting);
      setDeleting(null);
    } catch {
      notifyFailure('Couldn’t delete the note. Try again.');
    }
  }

  return (
    <View style={{ gap: space.sm }}>
      <SectionTitle>Notes</SectionTitle>
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onDelete={() => {
            dismissNotification();
            setDeleting(note.id);
          }}
        />
      ))}
      <Button label="Add note" variant="secondary" onPress={onAdd} />
      <Sheet
        visible={deleting !== null}
        title="Delete this note?"
        message="It’s gone for good."
        onClose={() => {
          setDeleting(null);
        }}
      >
        <Button
          label="Delete note"
          waitingLabel="Deleting note"
          variant="danger"
          waiting={deleteNote.isPending}
          onPress={() => void confirmDelete()}
        />
      </Sheet>
    </View>
  );
}

function NoteCard({
  note,
  onDelete,
}: {
  note: TicketNote;
  onDelete: () => void;
}) {
  const { colors, space, text } = useTheme();

  return (
    <Card>
      <View style={{ gap: space.xxs }}>
        <View style={[styles.heading, { gap: space.sm }]}>
          <Text style={[text.meta, styles.headingText]}>
            {formatDateTime(note.writtenAtUtc)}
          </Text>
          <Tappable
            accessibilityRole="button"
            accessibilityLabel="Delete note"
            hitSlop={space.md}
            onPress={onDelete}
          >
            <TrashIcon color={colors.dangerFill} size={18} />
          </Tappable>
        </View>
        <Text style={[text.body, { color: colors.text }]}>{note.text}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headingText: {
    flex: 1,
  },
});
