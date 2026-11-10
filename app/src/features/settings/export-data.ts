import { strToU8, zipSync, type Zippable } from 'fflate';

import type { components } from '@/api/schema';
import { dateText } from '@/formats/dates';
import {
  dayNames,
  formatClock,
  weightIn,
  weightUnitOf,
} from '@/formats/formats';

import { colorLabels, themeLabels, unitLabels } from './settings-labels';

type Schemas = components['schemas'];
type Export = Schemas['ExportResponse'];
type Units = Schemas['Units'];
type Field = string | number | null;

export interface ExportSources {
  data: Export;
  user: Schemas['UserResponse'];
  settings: Schemas['WorkoutSettingsResponse'];
  /** The profile photo as a Base64 JPEG, or null without one. */
  photo: string | null;
}

const statusLabels: Record<Schemas['WorkoutStatus'], string> = {
  inProgress: 'In progress',
  completed: 'Completed',
  skipped: 'Skipped',
};

/** A field in quotes when it holds a comma, quote or line break (RFC 4180). */
function field(value: Field) {
  const text = value === null ? '' : String(value);

  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** A CSV, header row first. The byte order mark lets Excel read accented letters. */
export function csv(rows: Field[][]) {
  return `\uFEFF${rows.map((row) => row.map(field).join(',')).join('\r\n')}\r\n`;
}

/** One row per checked set. A workout without sets, such as a skipped one, is one row of its own. */
function workoutRows(data: Export, units: Units): Field[][] {
  const header = [
    'Date',
    'Workout',
    'Status',
    'Duration (min)',
    'Exercise',
    'Group',
    'Set',
    `Weight (${weightUnitOf(units)})`,
    'Reps',
  ];
  const rows = data.workouts.flatMap((workout) => {
    const start = [
      workout.date,
      workout.name,
      statusLabels[workout.status],
      workout.durationSeconds === null
        ? null
        : Math.round(workout.durationSeconds / 60),
    ];
    const sets = workout.exercises.flatMap((exercise) =>
      exercise.sets.map((set, index) => [
        ...start,
        exercise.name,
        exercise.group,
        index + 1,
        weightIn(set.weightKg, units),
        set.reps,
      ]),
    );

    return sets.length > 0 ? sets : [[...start, null, null, null, null, null]];
  });

  return [header, ...rows];
}

function exerciseRows(data: Export): Field[][] {
  return [
    ['Name', 'Group', 'Also works'],
    ...data.exercises.map((exercise) => [
      exercise.name,
      exercise.group,
      exercise.alsoWorks.join('; '),
    ]),
  ];
}

function routineRows(data: Export): Field[][] {
  return [
    ['Routine', 'Days', 'Order', 'Exercise', 'Sets', 'Reps from', 'Reps to'],
    ...data.routines.flatMap((routine) =>
      routine.exercises.map((exercise, index) => [
        routine.name,
        routine.days.map((day) => dayNames[day].full).join('; '),
        index + 1,
        exercise.name,
        exercise.sets,
        exercise.repsFrom,
        exercise.repsTo,
      ]),
    ),
  ];
}

function accountRows({ user, settings }: ExportSources): Field[][] {
  const onOff = (on: boolean) => (on ? 'On' : 'Off');

  return [
    [
      'Name',
      'Email',
      'Units',
      'Theme',
      'Color',
      'Time zone',
      'Default rest',
      'Rest sound',
      'Rest vibrate',
    ],
    [
      user.name,
      user.email,
      unitLabels[user.units],
      themeLabels[user.theme],
      colorLabels[user.color],
      user.timeZone,
      formatClock(settings.defaultRestSeconds),
      onOff(settings.restSound),
      onOff(settings.restVibrate),
    ],
  ];
}

/** A ZIP of one CSV per kind of data, and the profile photo if there is one. */
export function exportZip(sources: ExportSources) {
  const { data, user, photo } = sources;
  const files: Zippable = {
    'workouts.csv': strToU8(csv(workoutRows(data, user.units))),
    'exercises.csv': strToU8(csv(exerciseRows(data))),
    'routines.csv': strToU8(csv(routineRows(data))),
    'account.csv': strToU8(csv(accountRows(sources))),
  };
  if (photo !== null) {
    files['photo.jpg'] = Uint8Array.from(atob(photo), (character) =>
      character.charCodeAt(0),
    );
  }

  return zipSync(files);
}

/** For example "herculean-export-2026-11-10.zip". */
export function exportFileName(date: Date) {
  return `herculean-export-${dateText(date)}.zip`;
}
