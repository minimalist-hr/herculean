import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

import { ApiProblemError, toFormErrors } from '@/api/problem';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { useFormDelete, type FormDelete } from '@/components/form-delete';
import { FormError } from '@/components/form-error';
import { FormPage } from '@/components/form-page';
import { FieldSkeleton, SkeletonGroup } from '@/components/skeleton';
import { TextField } from '@/components/text-field';
import { TextLink } from '@/components/text-link';
import { useLeaveGuard } from '@/components/use-leave-guard';
import { dismissNotification, notifyFailure } from '@/components/notifications';
import { OptionalNote } from '@/components/optional-note';
import { useTheme } from '@/theme/theme-provider';

import { exerciseSchema, type ExerciseValues } from './exercise-schema';
import { ChipsSkeleton } from './exercises-skeleton';

/** The groups an exercise can belong to, as a query. */
export interface GroupChoices {
  data?: readonly { id: string; name: string }[];
  isLoadingError: boolean;
  refetch: () => unknown;
}

/** The problem codes the API answers a taken name and a full list with. */
export interface ExerciseErrorCodes {
  nameTaken: string;
  limitReached: string;
}

const userExerciseCodes: ExerciseErrorCodes = {
  nameTaken: 'exercise.name_taken',
  limitReached: 'exercise.limit_reached',
};

interface ExerciseFormPageProps {
  /** The screen its back link returns to. */
  back: string;
  title: string;
  subtitle?: string;
  initialValues: ExerciseValues;
  groups: GroupChoices;
  groupsFailure?: string;
  codes?: ExerciseErrorCodes;
  saving: boolean;
  /** Saves the values. A failure it throws shows on the form. */
  onSave: (values: ExerciseValues) => Promise<unknown>;
  /** Edit can have a delete that asks first. */
  remove?: FormDelete;
}

function useExerciseForm(
  initialValues: ExerciseValues,
  codes: ExerciseErrorCodes,
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
        error.problem.code === codes.limitReached
      ) {
        notifyFailure(error.problem.detail);
        return;
      }

      const formErrors = toFormErrors(error, ['name'], {
        [codes.nameTaken]: 'name',
      });
      if (formErrors.fields.name !== undefined) {
        form.setError('name', { message: formErrors.fields.name });
      }
      if (formErrors.general) {
        notifyFailure('Couldn’t save the exercise. Try again.');
      }
    }
  });

  return { form, submit, guard };
}

type ExerciseForm = ReturnType<typeof useExerciseForm>['form'];

function AlsoWorksLabel() {
  const { text } = useTheme();

  return (
    <Text style={text.eyebrow}>
      Also works
      <OptionalNote />
    </Text>
  );
}

function ExerciseFields({
  form,
  groups,
  groupsFailure,
}: {
  form: ExerciseForm;
  groups: GroupChoices;
  groupsFailure: string;
}) {
  const { colors, size, space, text } = useTheme();
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
    renderChips: (group: { id: string; name: string }) => React.ReactNode,
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
          <FormError message={groupsFailure} />
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
            <AlsoWorksLabel />
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

/** The fields of an exercise while it loads. */
export function ExerciseFormSkeleton() {
  const { size, space, text } = useTheme();
  const chips = (
    <View style={[styles.chips, { gap: size.gap.chips }]}>
      <ChipsSkeleton />
    </View>
  );

  return (
    <SkeletonGroup label="Loading the exercise">
      <View style={{ gap: space.xl }}>
        <FieldSkeleton label="Name" />
        <View style={{ gap: space.sm }}>
          <Text style={text.eyebrow}>Group</Text>
          {chips}
        </View>
        <View style={{ gap: space.sm }}>
          <AlsoWorksLabel />
          {chips}
        </View>
      </View>
    </SkeletonGroup>
  );
}

/** A page with the fields of an exercise and Save exercise. */
export function ExerciseFormPage({
  back,
  title,
  subtitle,
  initialValues,
  groups,
  groupsFailure = 'Couldn’t load your groups.',
  codes = userExerciseCodes,
  saving,
  onSave,
  remove,
}: ExerciseFormPageProps) {
  const { form, submit, guard } = useExerciseForm(initialValues, codes, onSave);
  const deleting = useFormDelete(remove, guard);

  return (
    <>
      <FormPage
        back={back}
        title={title}
        subtitle={subtitle}
        headerAction={deleting.headerAction}
        action={
          <Button
            label="Save exercise"
            waitingLabel="Saving exercise"
            waiting={saving}
            onPress={() => void submit()}
          />
        }
      >
        <ExerciseFields
          form={form}
          groups={groups}
          groupsFailure={groupsFailure}
        />
      </FormPage>
      {deleting.sheet}
      {guard.sheet}
    </>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  groupsFailed: {
    alignItems: 'flex-start',
  },
});
