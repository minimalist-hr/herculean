import { strToU8, zipSync, type Zippable } from 'fflate';

import type { components } from '@/api/schema';
import {
  statusLabels as ticketStatusLabels,
  typeLabels as ticketTypeLabels,
} from '@/features/feedback/feedback-labels';
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
  feedback: Schemas['FeedbackExportResponse'];
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
    'Lengthened partials',
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
        set.partialsDone ? 'Yes' : 'No',
      ]),
    );

    return sets.length > 0
      ? sets
      : [[...start, null, null, null, null, null, null]];
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
    [
      'Routine',
      'Days',
      'Order',
      'Exercise',
      'Sets',
      'Reps from',
      'Reps to',
      'Superset with next',
      'Lengthened partials',
    ],
    ...data.routines.flatMap((routine) =>
      routine.exercises.map((exercise, index) => [
        routine.name,
        routine.days.map((day) => dayNames[day].full).join('; '),
        index + 1,
        exercise.name,
        exercise.sets,
        exercise.repsFrom,
        exercise.repsTo,
        exercise.supersetWithNext ? 'Yes' : 'No',
        exercise.lengthenedPartials ? 'Yes' : 'No',
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

/** A moment in the phone's time, for example "2026-11-10 14:05". */
function momentText(moment: string) {
  const local = new Date(moment);
  const hours = String(local.getHours()).padStart(2, '0');
  const minutes = String(local.getMinutes()).padStart(2, '0');

  return `${dateText(local)} ${hours}:${minutes}`;
}

/** Where a screenshot sits in the ZIP, for example "feedback/ticket-1-message-2-1.jpg". */
function screenshotFile(ticket: number, message: number, screenshot: number) {
  return `feedback/ticket-${String(ticket)}-message-${String(message)}-${String(screenshot)}.jpg`;
}

/** One row per message. Its screenshots are files in the ZIP, named in the row. */
function feedbackRows({ feedback }: ExportSources): Field[][] {
  return [
    [
      'Ticket',
      'Type',
      'Status',
      'Sent',
      'From',
      'Message',
      'Screenshots',
      'App version',
      'Phone',
      'OS',
    ],
    ...feedback.tickets.flatMap((ticket, ticketIndex) =>
      ticket.messages.map((message, messageIndex) => [
        ticketIndex + 1,
        ticketTypeLabels[ticket.type],
        ticketStatusLabels[ticket.status],
        momentText(message.sentAtUtc),
        message.author === 'admin' ? 'Minimalist' : 'You',
        message.text,
        message.screenshots
          .map((_, index) =>
            screenshotFile(ticketIndex + 1, messageIndex + 1, index + 1),
          )
          .join('; '),
        ticket.appVersion,
        ticket.phone ?? null,
        ticket.os,
      ]),
    ),
  ];
}

function jpeg(base64: string) {
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

/** A ZIP of one CSV per kind of data, the profile photo if there is one, and the feedback's screenshots. */
export function exportZip(sources: ExportSources) {
  const { data, user, photo, feedback } = sources;
  const files: Zippable = {
    'workouts.csv': strToU8(csv(workoutRows(data, user.units))),
    'exercises.csv': strToU8(csv(exerciseRows(data))),
    'routines.csv': strToU8(csv(routineRows(data))),
    'account.csv': strToU8(csv(accountRows(sources))),
    'feedback.csv': strToU8(csv(feedbackRows(sources))),
  };
  if (photo !== null) {
    files['photo.jpg'] = jpeg(photo);
  }
  feedback.tickets.forEach((ticket, ticketIndex) => {
    ticket.messages.forEach((message, messageIndex) => {
      message.screenshots.forEach((screenshot, index) => {
        files[screenshotFile(ticketIndex + 1, messageIndex + 1, index + 1)] =
          jpeg(screenshot);
      });
    });
  });

  return zipSync(files);
}

/** For example "herculean-export-2026-11-10.zip". */
export function exportFileName(date: Date) {
  return `herculean-export-${dateText(date)}.zip`;
}
