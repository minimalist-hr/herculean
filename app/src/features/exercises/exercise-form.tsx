import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewInstance,
} from 'react-native';

import { ApiProblemError, toFormErrors } from '@/api/problem';
import type { components } from '@/api/schema';
import { BottomActionBox } from '@/components/bottom-action-box';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { FormError } from '@/components/form-error';
import { ScreenHeading } from '@/components/screen-heading';
import { TextField } from '@/components/text-field';
import { TextLink } from '@/components/text-link';
import { useTheme } from '@/theme/theme-provider';

import { exerciseSchema, type ExerciseValues } from './exercise-schema';
import { ChipsSkeleton } from './exercises-skeleton';
import { useGroups } from './use-groups';

interface ExerciseFormProps {
  title: string;
  subtitle: string;
  initialValues: ExerciseValues;
  saving: boolean;
  /** Saves the values. A failure it throws shows on the form. */
  onSave: (values: ExerciseValues) => Promise<unknown>;
  onCancel: () => void;
}

/** The fields of an exercise, with Save exercise and Cancel. */
export function ExerciseForm({
  title,
  subtitle,
  initialValues,
  saving,
  onSave,
  onCancel,
}: ExerciseFormProps) {
  const { colors, size, space, text } = useTheme();
  const groups = useGroups();
  const scrollView = useRef<ScrollViewInstance>(null);
  const [generalError, setGeneralError] = useState<string>();
  const { control, handleSubmit, setError, setValue, formState } = useForm({
    resolver: zodResolver(exerciseSchema),
    defaultValues: initialValues,
  });
  const { errors } = formState;
  const groupId = useWatch({ control, name: 'groupId' });
  const alsoWorksGroupIds = useWatch({ control, name: 'alsoWorksGroupIds' });

  // The general error sits above the first field, so the form scrolls up to show it.
  useEffect(() => {
    if (generalError !== undefined) {
      scrollView.current?.scrollTo({ y: 0 });
    }
  }, [generalError]);

  const submit = handleSubmit(async (values) => {
    setGeneralError(undefined);
    try {
      await onSave(values);
    } catch (error) {
      if (
        error instanceof ApiProblemError &&
        error.problem.code === 'exercise.limit_reached'
      ) {
        setGeneralError(error.problem.detail);
        return;
      }

      const formErrors = toFormErrors(error, ['name'], {
        'exercise.name_taken': 'name',
      });
      if (formErrors.fields.name !== undefined) {
        setError('name', { message: formErrors.fields.name });
      }
      if (formErrors.general) {
        setGeneralError("Couldn't save the exercise. Try again.");
      }
    }
  });

  function pickGroup(id: string) {
    setGeneralError(undefined);
    setValue('groupId', id, { shouldValidate: errors.groupId !== undefined });
    // An exercise can't also work the group it belongs to.
    setValue(
      'alsoWorksGroupIds',
      alsoWorksGroupIds.filter((alsoWorksId) => alsoWorksId !== id),
    );
  }

  function toggleAlsoWorks(id: string) {
    setGeneralError(undefined);
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
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* Only the form makes room for the keyboard. The actions stay behind it until it closes. */}
      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
        <ScrollView
          ref={scrollView}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            gap: space.xl,
            paddingTop: size.topPaddingTab,
            paddingHorizontal: size.sidePadding,
            paddingBottom: space.lg,
          }}
        >
          <ScreenHeading title={title} subtitle={subtitle} />

          {generalError !== undefined && <FormError message={generalError} />}

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
                  setGeneralError(undefined);
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
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomActionBox>
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
          onPress={onCancel}
        />
      </BottomActionBox>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
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
