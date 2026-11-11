import { strFromU8, unzipSync } from 'fflate';

import {
  csv,
  exportFileName,
  exportZip,
  type ExportSources,
} from './export-data';

const sources: ExportSources = {
  data: {
    exercises: [
      { name: 'Barbell squat', group: 'Legs', alsoWorks: [] },
      { name: 'Pull-up', group: 'Back', alsoWorks: ['Biceps', 'Shoulders'] },
    ],
    routines: [
      {
        name: 'Legs, heavy',
        days: ['monday', 'thursday'],
        exercises: [
          {
            name: 'Barbell squat',
            sets: 3,
            repsFrom: 8,
            repsTo: 10,
            supersetWithNext: false,
            lengthenedPartials: false,
          },
        ],
      },
    ],
    workouts: [
      {
        date: '2026-11-02',
        name: 'Legs, heavy',
        status: 'completed',
        durationSeconds: 3850,
        exercises: [
          {
            name: 'Barbell squat',
            group: 'Legs',
            sets: [
              { weightKg: 100, reps: 5, partialsDone: true },
              { weightKg: 0, reps: 12, partialsDone: false },
            ],
          },
        ],
      },
      {
        date: '2026-11-03',
        name: 'Pull day',
        status: 'skipped',
        durationSeconds: null,
        exercises: [{ name: 'Pull-up', group: 'Back', sets: [] }],
      },
    ],
  },
  user: {
    email: 'filip@example.com',
    name: 'Filip Mučnjak',
    units: 'metric',
    theme: 'matchPhone',
    color: 'nitro',
    timeZone: 'Europe/Zagreb',
  },
  settings: { defaultRestSeconds: 180, restSound: true, restVibrate: false },
  photo: '/9j/',
  feedback: {
    tickets: [
      {
        type: 'bug',
        status: 'answered',
        appVersion: '1.0.0',
        phone: 'Google Pixel 8',
        os: 'Android 15',
        messages: [
          {
            author: 'user',
            text: 'The timer stops, again.',
            sentAtUtc: new Date(2026, 10, 10, 9, 5).toISOString(),
            screenshots: ['/9j/4A==', '/9j/4B=='],
          },
          {
            author: 'admin',
            text: 'Fixed in 1.0.1.',
            sentAtUtc: new Date(2026, 10, 11, 14, 30).toISOString(),
            screenshots: [],
          },
        ],
      },
    ],
  },
};

function unzip(from: ExportSources) {
  const files = unzipSync(exportZip(from));

  return {
    names: Object.keys(files).sort(),
    text: (name: string) => strFromU8(files[name]),
    files,
  };
}

test('a field with a comma, quote or line break is quoted', () => {
  expect(csv([['a,b', 'say "hi"', 'two\nlines', 3, null]])).toBe(
    '\uFEFF"a,b","say ""hi""","two\nlines",3,\r\n',
  );
});

test('the zip holds one csv per kind of data and the photo', () => {
  const zip = unzip(sources);

  expect(zip.names).toEqual([
    'account.csv',
    'exercises.csv',
    'feedback.csv',
    'feedback/ticket-1-message-1-1.jpg',
    'feedback/ticket-1-message-1-2.jpg',
    'photo.jpg',
    'routines.csv',
    'workouts.csv',
  ]);
  expect([...zip.files['photo.jpg'].slice(0, 3)]).toEqual([255, 216, 255]);
  // Excel reads accented letters only after a byte order mark.
  expect([...zip.files['workouts.csv'].slice(0, 3)]).toEqual([
    0xef, 0xbb, 0xbf,
  ]);
});

test('workouts have a row per set, and a skipped one a row of its own', () => {
  expect(unzip(sources).text('workouts.csv')).toBe(
    'Date,Workout,Status,Duration (min),Exercise,Group,Set,Weight (kg),Reps,Lengthened partials\r\n' +
      '2026-11-02,"Legs, heavy",Completed,64,Barbell squat,Legs,1,100,5,Yes\r\n' +
      '2026-11-02,"Legs, heavy",Completed,64,Barbell squat,Legs,2,0,12,No\r\n' +
      '2026-11-03,Pull day,Skipped,,,,,,,\r\n',
  );
});

test('weights follow the units setting', () => {
  const text = unzip({
    ...sources,
    user: { ...sources.user, units: 'imperial' },
  }).text('workouts.csv');

  expect(text).toContain('Weight (lb)');
  expect(text).toContain('Barbell squat,Legs,1,220.5,5');
});

test('exercises, routines and the account read like the app', () => {
  const zip = unzip(sources);

  expect(zip.text('exercises.csv')).toContain(
    'Pull-up,Back,Biceps; Shoulders\r\n',
  );
  expect(zip.text('routines.csv')).toContain(
    '"Legs, heavy",Monday; Thursday,1,Barbell squat,3,8,10,No,No\r\n',
  );
  expect(zip.text('account.csv')).toContain(
    'Filip Mučnjak,filip@example.com,Metric,Match my phone,Nitro,Europe/Zagreb,3:00,On,Off\r\n',
  );
});

test('feedback has a row per message, naming its screenshots', () => {
  expect(unzip(sources).text('feedback.csv')).toBe(
    csv([
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
      [
        1,
        'Bug',
        'Answered',
        '2026-11-10 09:05',
        'You',
        'The timer stops, again.',
        'feedback/ticket-1-message-1-1.jpg; feedback/ticket-1-message-1-2.jpg',
        '1.0.0',
        'Google Pixel 8',
        'Android 15',
      ],
      [
        1,
        'Bug',
        'Answered',
        '2026-11-11 14:30',
        'Minimalist',
        'Fixed in 1.0.1.',
        '',
        '1.0.0',
        'Google Pixel 8',
        'Android 15',
      ],
      // Reading the file drops the byte order mark.
    ]).slice(1),
  );
});

test('without feedback, feedback.csv has only its header', () => {
  const zip = unzip({ ...sources, feedback: { tickets: [] } });

  expect(zip.text('feedback.csv').split('\r\n')).toHaveLength(2);
  expect(zip.names.some((name) => name.startsWith('feedback/'))).toBe(false);
});

test('without a photo there is no photo file', () => {
  expect(unzip({ ...sources, photo: null }).names).not.toContain('photo.jpg');
});

test('the file is named after the day', () => {
  expect(exportFileName(new Date(2026, 10, 10))).toBe(
    'herculean-export-2026-11-10.zip',
  );
});
