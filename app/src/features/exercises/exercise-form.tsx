import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

import { ApiProblemError, toFormErrors } from '@/api/problem';
import type { components } from '@/api/schema';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { FormError } from '@/components/form-error';
import { FormPage } from '@/components/form-page';
import { TextField } from '@/components/text-field';
import { TextLink } from '@/components/text-link';
import { useLeaveGuard } from '@/components/use-leave-guard';
import { dismissNotification, notifyFailure } from '@/components/notifications';
import { useTheme } from '@/theme/theme-provider';

import { exerciseSchema, type ExerciseValues } from './exercise-schema';
import { ChipsSkeleton } from './exercises-skeleton';
import { useGroups } from './use-groups';

interface ExerciseFormPageProps {
  /** It opens inside a tab, so its actions sit on the tab bar. */
  aboveTabBar?: boolean;
  /** The screen its back link returns to. */
  back: string;
  title: string;
  subtitle: string;
  initialValues: ExerciseValues;
  saving: boolean;
  /** Saves the values. A failure it throws shows on the form. */
  onSave: (values: ExerciseValues) => Promise<unknown>;
}

function useExerciseForm(
  initialValues: ExerciseValues,
  onSave: (values: ExerciseValues) => Promise<unknown>,
) {
  const form = useForm({
    resolver: zodResolver(exerciseSchema),
    defaultValues: initialValues,
  });
  const guard = useLeaveGuard(form.formState.isDirty);

  const submit = form.handleSubmit(async (values) => {
    dismissNotification();
    guard.allow();
    try {
      await onSave(values);
    } catch (error) {
      guard.block();
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
        form.setError('name', { message: formErrors.fields.name });
      }
      if (formErrors.general) {
        notifyFailure("Couldn't save the exercise. Try again.");
      }
    }
  });

  return { form, submit, guard };
}

type ExerciseForm = ReturnType<typeof useExerciseForm>['form'];

function ExerciseFields({ form }: { form: ExerciseForm }) {
  const { colors, size, space, text } = useTheme();
  const groups = useGroups();
  const { control, setValue, formState } = form;
  const { errors } = formState;
  const groupId = useWatch({ control, name: 'groupId' });
  const alsoWorksGroupIds = useWatch({ control, name: 'alsoWorksGroupIds' });

  function pickGroup(id: string) {
    dismissNotification();
    setValue('groupId', id, {
      shouldDirty: true,
      shouldValidate: errors.groupId !== undefined,
    });
    // An exercise can't also work the group it belongs to.
    setValue(
      'alsoWorksGroupIds',
      alsoWorksGroupIds.filter((alsoWorksId) => alsoWorksId !== id),
      { shouldDirty: true },
    );
  }

  function toggleAlsoWorks(id: string) {
    dismissNotification();
    setValue(
      'alsoWorksGroupIds',
      alsoWorksGroupIds.includes(id)
        ? alsoWorksGroupIds.filter((alsoWorksId) => alsoWorksId !== id)
        : [...alsoWorksGroupIds, id],
      { shouldDirty: true },
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
    <View style={{ gap: space.xl }}>
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <TextField
            ref={field.ref}
            label="Name"
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

      {groups.isLoadingError ? (
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
            {errors.groupId !== undefined && (
              <Text style={[text.meta, { color: colors.danger }]}>
                {errors.groupId.message}
              </Text>
            )}
          </View>

          <View style={{ gap: space.sm }}>
            <Text style={text.eyebrow}>
              Also works
              <Text style={[text.meta, styles.optional]}> · optional</Text>
            </Text>
            {/* With one group, there is nothing else it can also work. */}
            {groups.data?.length === 1 ? (
              <Text style={text.meta}>
                Create another group to choose it here.
              </Text>
            ) : (
              renderGroups((group) =>
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
              )
            )}
          </View>
        </>
      )}
    </View>
  );
}

/** A page with the fields of an exercise and Save exercise. */
export function ExerciseFormPage({
  back,
  aboveTabBar = false,
  title,
  subtitle,
  initialValues,
  saving,
  onSave,
}: ExerciseFormPageProps) {
  const { form, submit, guard } = useExerciseForm(initialValues, onSave);

  return (
    <>
      <FormPage
        back={back}
        aboveTabBar={aboveTabBar}
        title={title}
        subtitle={subtitle}
        action={
          <Button
            label="Save exercise"
            waitingLabel="Saving exercise"
            waiting={saving}
            onPress={() => void submit()}
          />
        }
      >
        <ExerciseFields form={form} />
      </FormPage>
      {guard.sheet}
    </>
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
