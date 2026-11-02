import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

import { ApiProblemError, toFormErrors } from '@/api/problem';
import type { components } from '@/api/schema';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { FormError } from '@/components/form-error';
import { Sheet } from '@/components/sheet';
import { TextField } from '@/components/text-field';
import { TextLink } from '@/components/text-link';
import { dismissNotification, notifyFailure } from '@/components/notifications';
import { useTheme } from '@/theme/theme-provider';

import { exerciseSchema, type ExerciseValues } from './exercise-schema';
import { ChipsSkeleton } from './exercises-skeleton';
import { useGroups } from './use-groups';

interface ExerciseFormSheetProps {
  visible: boolean;
  title: string;
  subtitle: string;
  initialValues: ExerciseValues;
  saving: boolean;
  /** Saves the values. A failure it throws shows on the form. */
  onSave: (values: ExerciseValues) => Promise<unknown>;
  onClose: () => void;
}

/** A sheet with the fields of an exercise, Save exercise and Cancel. */
export function ExerciseFormSheet({
  visible,
  title,
  subtitle,
  initialValues,
  saving,
  onSave,
  onClose,
}: ExerciseFormSheetProps) {
  const { colors, size, space, text } = useTheme();
  const groups = useGroups();
  const { control, handleSubmit, setError, setValue, formState } = useForm({
    resolver: zodResolver(exerciseSchema),
    defaultValues: initialValues,
  });
  const { errors } = formState;
  const groupId = useWatch({ control, name: 'groupId' });
  const alsoWorksGroupIds = useWatch({ control, name: 'alsoWorksGroupIds' });

  const submit = handleSubmit(async (values) => {
    dismissNotification();
    try {
      await onSave(values);
    } catch (error) {
      if (
        error instanceof ApiProblemError &&
        error.problem.code === 'exercise.limit_reached'
      ) {
        notifyFailure(error.problem.detail);
        return;
      }

      const formErrors = toFormErrors(error, ['name'], {
        'exercise.name_taken': 'name',
      });
      if (formErrors.fields.name !== undefined) {
        setError('name', { message: formErrors.fields.name });
      }
      if (formErrors.general) {
        notifyFailure("Couldn't save the exercise. Try again.");
      }
    }
  });

  function pickGroup(id: string) {
    dismissNotification();
    setValue('groupId', id, { shouldValidate: errors.groupId !== undefined });
    // An exercise can't also work the group it belongs to.
    setValue(
      'alsoWorksGroupIds',
      alsoWorksGroupIds.filter((alsoWorksId) => alsoWorksId !== id),
    );
  }

  function toggleAlsoWorks(id: string) {
    dismissNotification();
    setValue(
      'alsoWorksGroupIds',
      alsoWorksGroupIds.includes(id)
        ? alsoWorksGroupIds.filter((alsoWorksId) => alsoWorksId !== id)
        : [...alsoWorksGroupIds, id],
    );
  }

  function renderGroups(
    renderChips: (
      group: components['schemas']['GroupResponse'],
    ) => React.ReactNode,
  ) {
    return (
      <View style={[styles.chips, { gap: size.gap.chips }]}>
        {groups.data === undefined ? (
          <ChipsSkeleton />
        ) : (
          groups.data.map(renderChips)
        )}
      </View>
    );
  }

  return (
    <Sheet
      visible={visible}
      title={title}
      message={subtitle}
      onClose={onClose}
      body={
        <View style={{ gap: space.xl }}>
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <TextField
                ref={field.ref}
                label="Name"
                placeholder="Cable lateral raise"
                autoCapitalize="sentences"
                returnKeyType="done"
                value={field.value}
                onChangeText={(value) => {
                  dismissNotification();
                  field.onChange(value);
                }}
                onBlur={field.onBlur}
                error={errors.name?.message}
              />
            )}
          />

          {groups.isError ? (
            <View style={styles.groupsFailed}>
              <FormError message="Couldn't load your groups." />
              <TextLink
                label="Try again"
                onPress={() => {
                  void groups.refetch();
                }}
              />
            </View>
          ) : (
            <>
              <View style={{ gap: space.sm }}>
                <Text style={text.eyebrow}>Group</Text>
                {renderGroups((group) => (
                  <Chip
                    key={group.id}
                    label={group.name}
                    selected={groupId === group.id}
                    onPress={() => {
                      pickGroup(group.id);
                    }}
                  />
                ))}
                <Text
                  style={[
                    text.meta,
                    errors.groupId !== undefined && { color: colors.danger },
                  ]}
                >
                  {errors.groupId?.message ??
                    'Where it shows in your exercise list.'}
                </Text>
              </View>

              <View style={{ gap: space.sm }}>
                <Text style={text.eyebrow}>
                  Also works
                  <Text style={[text.meta, styles.optional]}> · optional</Text>
                </Text>
                {renderGroups((group) =>
                  group.id === groupId ? null : (
                    <Chip
                      key={group.id}
                      label={`${group.name}, also works`}
                      text={group.name}
                      selected={alsoWorksGroupIds.includes(group.id)}
                      onPress={() => {
                        toggleAlsoWorks(group.id);
                      }}
                    />
                  ),
                )}
              </View>
            </>
          )}
        </View>
      }
    >
      <Button
        label="Save exercise"
        waitingLabel="Saving exercise"
        waiting={saving}
        onPress={() => void submit()}
      />
      <Button
        label="Cancel"
        variant="secondary"
        dimmed={saving}
        onPress={onClose}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  // Quieter than the label around it, so it reads as a note and not as part of the name.
  optional: {
    textTransform: 'none',
    letterSpacing: 0,
  },
  groupsFailed: {
    alignItems: 'flex-start',
  },
});
