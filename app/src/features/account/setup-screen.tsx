import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewInstance,
} from 'react-native';

import { toFormErrors } from '@/api/problem';
import { BottomActionBox } from '@/components/bottom-action-box';
import { Button } from '@/components/button';
import { FormError } from '@/components/form-error';
import { QuickPicks } from '@/components/quick-picks';
import { RadioCard } from '@/components/radio-card';
import { ScreenHeading } from '@/components/screen-heading';
import { Stepper } from '@/components/stepper';
import { TextField } from '@/components/text-field';
import { defaultRest } from '@/features/settings/default-rest';
import { formatClock, formatSpokenDuration } from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

import { setupSchema, type SetupValues } from './setup-schema';
import { useFinishSetup } from './use-finish-setup';

const startingValues: SetupValues = {
  name: '',
  units: 'metric',
  defaultRestSeconds: defaultRest.startingSeconds,
};

export function SetupScreen() {
  const { colors, size, space, text } = useTheme();
  const finishSetup = useFinishSetup();
  const scrollView = useRef<ScrollViewInstance>(null);
  const [generalError, setGeneralError] = useState(false);
  const { control, handleSubmit, setError, formState } = useForm({
    resolver: zodResolver(setupSchema),
    defaultValues: startingValues,
  });
  const { errors } = formState;

  // The general error sits above the first field, so the form scrolls up to show it.
  useEffect(() => {
    if (generalError) {
      scrollView.current?.scrollTo({ y: 0 });
    }
  }, [generalError]);

  const submit = handleSubmit(async (values) => {
    setGeneralError(false);
    try {
      // Setup done, so the app opens Home in its place.
      await finishSetup.mutateAsync(values);
    } catch (error) {
      const formErrors = toFormErrors(error, ['name']);
      if (formErrors.fields.name !== undefined) {
        setError('name', { message: formErrors.fields.name });
      }
      setGeneralError(formErrors.general);
    }
  });

  // Any change clears the general error.
  function change<Value>(onChange: (value: Value) => void) {
    return (value: Value) => {
      setGeneralError(false);
      onChange(value);
    };
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
          <ScreenHeading
            label="Welcome to Herculean"
            title="Set up"
            subtitle="You can change all of this later in Settings."
          />

          <View style={{ gap: space.lg }}>
            {generalError && (
              <FormError message="Couldn't finish setup. Try again." />
            )}
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <TextField
                  ref={field.ref}
                  label="Name"
                  placeholder="Your name"
                  autoComplete="name"
                  autoCapitalize="words"
                  // The other choices are not text fields, so the key closes the keyboard.
                  returnKeyType="done"
                  value={field.value}
                  onChangeText={change(field.onChange)}
                  onBlur={field.onBlur}
                  error={errors.name?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="units"
              render={({ field }) => (
                <View style={{ gap: space.sm }}>
                  <Text style={text.eyebrow}>Units</Text>
                  <View
                    accessibilityRole="radiogroup"
                    accessibilityLabel="Units"
                    style={[styles.row, { gap: space.sm }]}
                  >
                    <RadioCard
                      label="Metric"
                      detail="kg, cm"
                      selected={field.value === 'metric'}
                      onSelect={() => {
                        change(field.onChange)('metric');
                      }}
                    />
                    <RadioCard
                      label="Imperial"
                      detail="lb, in"
                      selected={field.value === 'imperial'}
                      onSelect={() => {
                        change(field.onChange)('imperial');
                      }}
                    />
                  </View>
                </View>
              )}
            />

            <Controller
              control={control}
              name="defaultRestSeconds"
              render={({ field }) => (
                <View style={{ gap: space.sm }}>
                  <Text style={text.eyebrow}>Default rest time</Text>
                  <Stepper
                    label="Default rest time"
                    value={field.value}
                    onChange={change(field.onChange)}
                    min={defaultRest.minSeconds}
                    max={defaultRest.maxSeconds}
                    step={defaultRest.stepSeconds}
                    format={formatClock}
                    formatSpoken={formatSpokenDuration}
                    lessLabel="15 seconds less"
                    moreLabel="15 seconds more"
                  />
                  <QuickPicks
                    values={defaultRest.quickPicks}
                    selected={field.value}
                    onSelect={change(field.onChange)}
                    format={formatClock}
                    formatSpoken={formatSpokenDuration}
                  />
                  <Text style={text.meta}>Starts after every checked set.</Text>
                </View>
              )}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomActionBox>
        <Button
          label="Finish setup"
          waitingLabel="Finishing setup"
          waiting={finishSetup.isPending}
          onPress={() => void submit()}
        />
      </BottomActionBox>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
});
