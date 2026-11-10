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
              { weightKg: 100, reps: 5 },
              { weightKg: 0, reps: 12 },
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
    'Date,Workout,Status,Duration (min),Exercise,Group,Set,Weight (kg),Reps\r\n' +
      '2026-11-02,"Legs, heavy",Completed,64,Barbell squat,Legs,1,100,5\r\n' +
      '2026-11-02,"Legs, heavy",Completed,64,Barbell squat,Legs,2,0,12\r\n' +
      '2026-11-03,Pull day,Skipped,,,,,,\r\n',
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
    '"Legs, heavy",Monday; Thursday,1,Barbell squat,3,8,10,No\r\n',
  );
  expect(zip.text('account.csv')).toContain(
    'Filip Mučnjak,filip@example.com,Metric,Match my phone,Nitro,Europe/Zagreb,3:00,On,Off\r\n',
  );
});

test('without a photo there is no photo file', () => {
  expect(unzip({ ...sources, photo: null }).names).not.toContain('photo.jpg');
});

test('the file is named after the day', () => {
  expect(exportFileName(new Date(2026, 10, 10))).toBe(
    'herculean-export-2026-11-10.zip',
  );
});
