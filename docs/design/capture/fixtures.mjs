// The design's sample data, as the API would answer it, so every capture is the same.

const groups = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs'].map(
  (name) => ({ id: `group-${name.toLowerCase()}`, name }),
);
const [chest, back, shoulders, biceps, triceps, legs] = groups;

/** An exercise in the list, with its best set as weight, reps and date, or none if it was never done. */
function exercise(name, group, best) {
  return {
    id: `exercise-${name.toLowerCase().replaceAll(' ', '-')}`,
    name,
    groupId: group.id,
    groupName: group.name,
    bestSet: best === undefined ? null : { weightKg: best[0], reps: best[1], date: best[2] },
  };
}

const exercises = [
  exercise('Flat barbell bench press', chest, [82.5, 10, '2026-10-09']),
  exercise('Incline dumbbell bench press', chest, [32.5, 10, '2026-10-19']),
  exercise('Cable crossover', chest, [20, 12, '2026-10-12']),
  exercise('Barbell row', back, [80, 8, '2026-10-17']),
  exercise('Lat pulldown', back, [65, 10, '2026-10-17']),
  exercise('Dumbbell shoulder press', shoulders, [26, 8, '2026-10-17']),
  exercise('Cable lateral raise', shoulders),
  exercise('EZ bar bicep curl', biceps, [35, 10, '2026-10-19']),
  exercise('Seated incline dumbbell curl', biceps, [14, 10, '2026-10-12']),
  exercise('EZ bar skullcrusher', triceps, [35, 12, '2026-10-19']),
  exercise('Straight bar pushdown', triceps, [30, 12, '2026-10-05']),
  exercise('Barbell squat', legs, [120, 5, '2026-10-14']),
  exercise('Leg press', legs, [200, 10, '2026-10-14']),
];

function target(name, targetSets, targetRepsFrom, targetRepsTo) {
  const item = exercises.find((candidate) => candidate.name === name);

  return {
    exerciseId: item.id,
    name,
    groupId: item.groupId,
    groupName: item.groupName,
    targetSets,
    targetRepsFrom,
    targetRepsTo,
  };
}

const chestAndArms = {
  id: 'routine-chest-and-arms-1',
  name: 'Chest and arms 1',
  weekdays: ['monday'],
  lastDoneOn: '2026-10-19',
  exercises: [
    target('Flat barbell bench press', 3, 8, 10),
    target('EZ bar bicep curl', 3, 10, 12),
    target('EZ bar skullcrusher', 3, 10, 12),
    target('Incline dumbbell bench press', 2, 10, 12),
    target('Seated incline dumbbell curl', 3, 10, 12),
    target('Straight bar pushdown', 3, 10, 12),
    target('Cable crossover', 2, 10, 12),
  ],
};

const backAndShoulders = [target('Barbell row', 3, 8, 10), target('Lat pulldown', 2, 10, 12), target('Dumbbell shoulder press', 3, 8, 10)];

// The design's week plan. Cable lateral raise is in none of it: it stands for an exercise never done and in no routine.
const routines = [
  chestAndArms,
  { id: 'routine-back-and-shoulders-1', name: 'Back and shoulders 1', weekdays: ['tuesday'], lastDoneOn: '2026-10-20', exercises: backAndShoulders },
  { id: 'routine-legs', name: 'Legs', weekdays: ['wednesday'], lastDoneOn: '2026-10-14', exercises: [target('Barbell squat', 3, 8, 10), target('Leg press', 3, 10, 12)] },
  {
    id: 'routine-chest-and-arms-2',
    name: 'Chest and arms 2',
    weekdays: ['friday'],
    lastDoneOn: '2026-10-16',
    exercises: [...chestAndArms.exercises].sort((first, second) => first.groupName.localeCompare(second.groupName)),
  },
  { id: 'routine-back-and-shoulders-2', name: 'Back and shoulders 2', weekdays: ['saturday'], lastDoneOn: '2026-10-17', exercises: backAndShoulders },
];

const setCountOf = (routine) => routine.exercises.reduce((total, item) => total + item.targetSets, 0);
const routineList = routines.map((routine) => ({
  id: routine.id,
  name: routine.name,
  exerciseCount: routine.exercises.length,
  setCount: setCountOf(routine),
  weekdays: routine.weekdays,
  lastDoneOn: routine.lastDoneOn,
}));

const sampleToday = '2026-10-23';

export const sampleSummary = {
  name: 'Chest and arms 2',
  date: '2026-10-23',
  durationSeconds: 3850,
  setsChecked: 17,
  setsTotal: 19,
  volumeKg: 9840,
  uncheckedExercises: [{ name: 'Cable crossover', uncheckedSets: 2, sets: 2 }],
  records: [
    { name: 'Flat barbell bench press', kind: 'heaviestWeight', weightKg: 85, reps: 8 },
    { name: 'EZ bar bicep curl', kind: 'mostReps', weightKg: 30, reps: 12 },
  ],
};

const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function weekPlan(routines) {
  return weekdays.map((weekday) => {
    const routine = routines.find((item) => item.weekdays.includes(weekday));

    return { weekday, routineId: routine?.id ?? null, routineName: routine?.name ?? null };
  });
}

function exerciseDetails(item, routines) {
  return {
    id: item.id,
    name: item.name,
    group: groups.find((group) => group.id === item.groupId),
    alsoWorksGroups: item.name === 'Flat barbell bench press' ? [triceps] : [],
    routines,
    bestSet: null,
    timesDone: 0,
    firstDoneOn: null,
  };
}

const sampleFirstDay = '2025-09-01';
// How past days went differently from the plan. Every other past planned day was done.
const sampleMissed = ['2025-10-20', '2026-09-02', '2026-10-21'];
const sampleSkipped = ['2026-10-03'];

const addDays = (date, days) => new Date(Date.parse(date) + days * 86_400_000).toISOString().slice(0, 10);
const routineOn = (date) => {
  const weekday = weekdays[(new Date(date).getUTCDay() + 6) % 7];

  return routines.find((routine) => routine.weekdays.includes(weekday));
};

/** How a day stands. A day before the first day, or with no plan at all, is a rest day. */
function statusOn(date, { today = sampleToday, firstDay = sampleFirstDay, noPlan = false } = {}) {
  if (noPlan || date < firstDay || routineOn(date) === undefined) {
    return 'rest';
  }
  if (date >= today) {
    return 'planned';
  }
  if (sampleSkipped.includes(date)) {
    return 'skipped';
  }

  return sampleMissed.includes(date) ? 'missed' : 'completed';
}

/** A day of the sample plan, as the API answers it. */
export function dayOf(date, options) {
  const status = statusOn(date, options);
  const routine = status === 'rest' ? undefined : routineOn(date);
  const nextDate = addDays(date, 1);

  return {
    date,
    status,
    hasRoutines: true,
    workoutId: status === 'completed' || status === 'skipped' ? `workout-${date}` : null,
    routine: routine === undefined ? null : { id: routine.id, name: routine.name, exercises: routine.exercises },
    upNext: { date: nextDate, routineName: routineOn(nextDate)?.name ?? null },
  };
}

export const sampleDay = dayOf(sampleToday);
export const legsDay = dayOf('2026-10-21');

const loggedSet = (exercise, order, weightKg, reps, checked) => ({ id: `${exercise}-set-${String(order)}`, order, weightKg, reps, checked });
const doneSets = (exercise, sets) => sets.map(([weightKg, reps], order) => loggedSet(exercise, order, weightKg, reps, true));
const emptySets = (exercise, count) => Array.from({ length: count }, (_, order) => loggedSet(exercise, order, 20, 10, false));
const setsOfSample = {
  'EZ bar bicep curl': (id) => doneSets(id, [[30, 12], [30, 11], [30, 10]]),
  'Seated incline dumbbell curl': (id) => doneSets(id, [[12.5, 12], [12.5, 11], [12.5, 10]]),
  'Flat barbell bench press': (id) => [loggedSet(id, 0, 80, 10, true), loggedSet(id, 1, 82.5, 10, false), loggedSet(id, 2, 82.5, 8, false)],
};

/** The design's sample workout in progress: 7 of 19 sets, six minutes in. */
export const sampleWorkout = {
  id: 'workout-in-progress',
  date: '2026-10-23',
  status: 'inProgress',
  name: sampleDay.routine.name,
  startedAtUtc: new Date('2026-10-23T17:53:20').toISOString(),
  exercises: sampleDay.routine.exercises.map((exercise) => {
    const id = `workout-${exercise.exerciseId}`;

    return {
      ...exercise,
      id,
      sets: setsOfSample[exercise.name]?.(id) ?? emptySets(id, exercise.targetSets),
      lastTime:
        exercise.name === 'Flat barbell bench press'
          ? { date: '2026-10-16', sets: [{ weightKg: 80, reps: 10 }, { weightKg: 82.5, reps: 10 }, { weightKg: 82.5, reps: 8 }] }
          : null,
    };
  }),
};

/** The sample workout once saved: only checked sets, with what it came to. */
export const savedWorkout = {
  ...sampleWorkout,
  status: 'completed',
  finishedAtUtc: new Date(Date.parse(sampleWorkout.startedAtUtc) + 3_850_000).toISOString(),
  durationSeconds: 3850,
  exercises: sampleWorkout.exercises
    .map((exercise) => ({ ...exercise, sets: exercise.sets.filter((set) => set.checked) }))
    .filter((exercise) => exercise.sets.length > 0),
};

export const savedSummary = {
  name: sampleWorkout.name,
  date: '2026-10-23',
  durationSeconds: 3850,
  setsChecked: savedWorkout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0),
  setsTotal: savedWorkout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0),
  volumeKg: savedWorkout.exercises.reduce((sum, exercise) => sum + exercise.sets.reduce((total, set) => total + set.weightKg * set.reps, 0), 0),
  uncheckedExercises: [],
  records: [{ name: 'EZ bar bicep curl', kind: 'mostReps', weightKg: 30, reps: 12 }],
};

/** A past day's saved workout: its routine, with every set done. */
export function savedOn(date, id = `workout-${date}`) {
  const routine = routineOn(date);

  return {
    id,
    date,
    status: 'completed',
    name: routine.name,
    startedAtUtc: `${date}T16:00:00Z`,
    finishedAtUtc: `${date}T16:52:10Z`,
    exercises: routine.exercises.map((item) => {
      const exerciseId = `${id}-${item.exerciseId}`;
      const weightKg = exercises.find((candidate) => candidate.name === item.name).bestSet?.weightKg ?? 20;

      return {
        ...item,
        id: exerciseId,
        lastTime: null,
        sets: Array.from({ length: item.targetSets }, (_, order) => loggedSet(exerciseId, order, weightKg, item.targetRepsFrom, true)),
      };
    }),
  };
}

/** A saved workout's summary, with no new records. */
export function summaryOf(workout) {
  const sets = workout.exercises.flatMap((item) => item.sets);

  return {
    name: workout.name,
    date: workout.date,
    durationSeconds: 3130,
    setsChecked: sets.length,
    setsTotal: sets.length,
    volumeKg: sets.reduce((total, set) => total + set.weightKg * set.reps, 0),
    uncheckedExercises: [],
    records: [],
  };
}

/** The days from one date to another, as the API lists them. `statuses` changes how some days stand. */
export function sampleRange(from, to, { statuses = {}, ...options } = {}) {
  const days = [];
  for (let date = from; date <= to; date = addDays(date, 1)) {
    const status = statuses[date] ?? statusOn(date, options);

    days.push({ date, status, routineName: status === 'rest' ? null : (routineOn(date)?.name ?? null) });
  }

  return days;
}

/** Answers the week strip and the calendar with these options. */
export const daysAnswer = (options) => (url) => ({ status: 200, body: sampleRange(url.searchParams.get('from'), url.searchParams.get('to'), options) });

/** A month's summary, worked out from its days as the API does. */
export function monthSummary(month, options) {
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDate = new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10);
  const planned = sampleRange(`${month}-01`, lastDate, options).filter((day) => ['completed', 'missed', 'skipped'].includes(day.status));
  const count = (status) => planned.filter((day) => day.status === status).length;
  const setsOf = (days) => days.reduce((total, day) => total + setCountOf(routineOn(day.date)), 0);
  const setsDone = setsOf(planned.filter((day) => day.status === 'completed'));

  return {
    done: count('completed'),
    missed: count('missed'),
    skipped: count('skipped'),
    minutesTrained: count('completed') * 61,
    setsDone,
    setsPlanned: setsOf(planned),
    volumeKg: setsDone * 540,
    plannedDays: planned.length,
    consistencyPercent: planned.length === 0 ? null : Math.round((100 * count('completed')) / planned.length),
  };
}

/** A small placeholder portrait, as the API sends a photo. */
export const samplePhoto = '/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCACAAIADASIAAhEBAxEB/8QAHAABAQADAQEBAQAAAAAAAAAAAAECBQcGBAMI/8QANxAAAgICAAMEBggGAwAAAAAAAAECAwQFBhEhEjFBYRMUUXGBkQciUnKxssHCJDJCkqHwIzNz/8QAGAEBAQEBAQAAAAAAAAAAAAAAAAECBAP/xAAXEQEBAQEAAAAAAAAAAAAAAAAAAREC/9oADAMBAAIRAxEAPwDyLIDE7HOEYZCKEBABGw2YkUICACMMhAMQQihAQDYEYZDbIQEAEbDZiRQh6fR8DZ+0hHIypep48uq7Uec5ryXgvNnrMfgHQ0xStqtyH4uy1r8vIzsXK5WRnVMngDQ3Qarqux34Ou1v83M8lveBc/VVyyMWXrmPHrLsx5TgvNeK80NMeXMQQAQEAGIIBsSAhtkI2GzEih7HgXhyGda9pmVqVFUuVUH3TkvF+S/H3HjTtWmwo6/TYmJFcvR1JP73e/8ALZnqrH2gAw2AADm3H3DUMC1bXCrUaLZcroR7oTfivJ/j7zxR3Dd4UdjpczEkufpKpKP3l1T+aRw41GaGIIVAgIRWxI2GzE2yEBAB3WmyN1Fdsf5ZxUl7mjhLOrcD7eGy0NePKf8Az4iVc1z69n+l/Lp8DHTUejABloAAGF1kaaLLZ/ywi5P3JHATrnHe5hrNBZjxmvWMxOqEefXs/wBT+XT4nIixmhAQoEBiQbEgIejIRhkIB9un3GVpNhDMxZdV0nB904+KZ8BCK7Po+Jddvak8e1QvS+vRN8pL3e1eaNscCjOUJKUW4yT5pp8mjbY/F2/xIKNW0uaXd6TlP8yZnF12c1G94m12hpbyLVO9r6lEHzm/f7F5s5dk8X8QZcHC3aXJPv8AR8oflSNNOcpycpNyk3zbb5tjDX3brc5W82E8zLl1fSEF3Qj4JGvBCgQGJAICBWxIwyG2AxBCKENvouGdjv7f4avsURfKd8+kV7va/I6JqOBdNrIxnbV65eu+dy5r4R7vnzJq45Zi67OznyxMO+//AM63JL5Gzr4K4jtXOOsmvvWQj+LOxRjGEVGEVGK6JJckik1ccbt4J4jqXOWrm/u2Ql+DNTl63OwHyy8O+jzsrcV/k70SUIzi4zipRfRprmmNMfz4Q7BuOAtLtIynVT6le+6yhcl8Y93y5HNt/wAL7Lh63+Jr9JRJ8oX19YvyfsfkwjTEBAoRsNmIGyMQQ0yHpOEeFLN9kesZKlDBql9Zro7H9lfqzT6jW27faUYNPSVsuTl9mPi/kdrwsOjX4dWJjQ7FVMezFf74ktWRnRRTi0QoorjXVWuUYRXJJGYBloAAAAAD88jHpy8eePkVRtqsXZlCS5po/QAce4y4Qs4fyPWcZSs19suUW+rqf2X+jPLNn9B52FRssG7Dyodum6LjJf74nCN1q7tLtsjX3dZUy5KX2o96fxQR8JAQDYkBDbLoH0Y65NZmznHqmqa37PGX7T355v6P6lXwjjzS/wC2dkn/AHNfoekMVqAACgAAAAAAABzn6VtYksLawjybbosft8Y/uOjHl/pHpVvBuTNrrVOua/uUf3AcZIwyEH//2Q==';

export const problem = (status, code, detail) => ({
  status,
  body: { type: 'about:blank', title: 'Error', status, detail, code, traceId: '00-capture' },
});

/** What the API answers, from a fresh copy of the sample data for each capture. */
export function createApi() {
  const list = [...exercises];
  let routine = chestAndArms;

  return (method, path, body, query) => {
    const key = `${method} ${path}`;
    const id = path.split('/')[4];

    if (key === 'POST /api/v1/sessions' || key === 'POST /api/v1/users') {
      return { status: 200, body: { accessToken: 'capture', expiresIn: 3600, refreshToken: 'capture' } };
    }
    if (key === 'GET /api/v1/users/me') {
      return { status: 200, body: { email: 'filip@example.com', name: 'Filip Mučnjak', units: 'metric', theme: 'matchPhone', color: 'nitro', timeZone: 'Europe/Zagreb' } };
    }
    if (key === 'GET /api/v1/streak') {
      return { status: 200, body: { weeks: 6, best: 11 } };
    }
    if (key === 'GET /api/v1/records/recent') {
      return {
        status: 200,
        body: [
          { exerciseId: exercises[0].id, exerciseName: exercises[0].name, weightKg: 82.5, reps: 10, date: '2026-10-09' },
          { exerciseId: exercises[11].id, exerciseName: exercises[11].name, weightKg: 120, reps: 5, date: '2026-10-14' },
        ],
      };
    }
    if (key === 'GET /api/v1/users/me/photo') {
      return { status: 200, body: { image: null } };
    }
    if (key === 'GET /api/v1/email-changes/pending') {
      return { status: 200, body: { newEmail: null } };
    }
    if (key === 'GET /api/v1/groups') {
      return {
        status: 200,
        body: groups.map((group) => ({ ...group, exerciseCount: list.filter((item) => item.groupId === group.id).length })),
      };
    }
    if (key === 'GET /api/v1/exercises') {
      const search = query?.get('search')?.toLowerCase() ?? '';
      const groupId = query?.get('groupId');

      return {
        status: 200,
        body: list.filter((item) => item.name.toLowerCase().includes(search) && (!groupId || item.groupId === groupId)),
      };
    }
    if (key === 'POST /api/v1/exercises') {
      const created = {
        ...exercise(body.name, groups.find((group) => group.id === body.groupId)),
      };
      list.push(created);

      return { status: 201, body: { id: created.id, name: created.name, groupId: created.groupId, alsoWorksGroupIds: [] } };
    }
    if (method === 'GET' && path.endsWith('/sessions')) {
      return { status: 200, body: { sessions: [], months: [], nextCursor: null } };
    }
    if (method === 'GET' && path.endsWith('/progress')) {
      return { status: 200, body: { byMonth: false, points: [] } };
    }
    if (method === 'GET' && path.startsWith('/api/v1/exercises/')) {
      const item = list.find((candidate) => candidate.id === id) ?? list[0];

      return { status: 200, body: exerciseDetails(item, []) };
    }
    if (method === 'GET' && path.startsWith('/api/v1/groups/')) {
      const group = groups.find((candidate) => candidate.id === id) ?? chest;

      return {
        status: 200,
        body: {
          ...group,
          exercises: list.filter((item) => item.groupId === group.id),
          alsoWorksExercises: group === triceps ? [list[0]] : [],
        },
      };
    }
    if (key === 'GET /api/v1/days') {
      return { status: 200, body: sampleRange(query.get('from'), query.get('to')) };
    }
    if (method === 'GET' && path.startsWith('/api/v1/month-summaries/')) {
      return { status: 200, body: monthSummary(path.split('/')[4]) };
    }
    if (key === 'GET /api/v1/days/first') {
      return { status: 200, body: { date: sampleFirstDay } };
    }
    if (method === 'GET' && path.startsWith('/api/v1/days/')) {
      return { status: 200, body: dayOf(path.split('/')[4]) };
    }
    if (key === 'GET /api/v1/workout-settings') {
      return { status: 200, body: { defaultRestSeconds: 180, restSound: true, restVibrate: true } };
    }
    if (method === 'PATCH' && path.startsWith(`/api/v1/workouts/${sampleWorkout.id}/`)) {
      const exercise = sampleWorkout.exercises.find((item) => item.id === path.split('/')[6]);

      return { status: 200, body: exercise.sets.map((set) => (set.id === path.split('/')[8] ? { ...set, ...body } : set)) };
    }
    const savedPath = /^\/api\/v1\/workouts\/workout-(\d{4}-\d{2}-\d{2})(\/summary)?$/.exec(path);
    if (method === 'GET' && savedPath !== null) {
      const workout = savedOn(savedPath[1]);

      return { status: 200, body: savedPath[2] === undefined ? workout : summaryOf(workout) };
    }
    if (key === 'GET /api/v1/workouts') {
      return { status: 200, body: [] };
    }
    if (key === `GET /api/v1/workouts/${sampleWorkout.id}/summary`) {
      return { status: 200, body: sampleSummary };
    }
    if (key === `GET /api/v1/workouts/${sampleWorkout.id}`) {
      return { status: 200, body: sampleWorkout };
    }
    if (key === 'GET /api/v1/routines') {
      return { status: 200, body: routineList };
    }
    if (key === 'POST /api/v1/routines') {
      return { status: 201, body: { id: 'routine-new', name: body.name, movedDays: [] } };
    }
    if (key === 'GET /api/v1/week-plan-days') {
      return { status: 200, body: weekPlan(routineList) };
    }
    if (method === 'GET' && path.startsWith('/api/v1/routines/')) {
      return { status: 200, body: routine };
    }
    if (method === 'PUT' && path.startsWith('/api/v1/routines/')) {
      const movedDays = body.weekdays.flatMap((weekday) =>
        routineList
          .filter((item) => item.id !== id && item.weekdays.includes(weekday))
          .map((item) => ({ weekday, fromRoutine: item.name })),
      );
      routine = { ...routine, name: body.name, weekdays: body.weekdays };

      return { status: 200, body: { id, name: body.name, movedDays } };
    }
    if (method === 'DELETE') {
      return { status: 204 };
    }
    if (method === 'POST' && path.endsWith('/restore')) {
      return { status: 200, body: { id, name: 'Restored' } };
    }
    if (key === 'POST /api/v1/password-resets') {
      return { status: 204 };
    }

    return { status: 200, body: {} };
  };
}

/** A date some days before another, as the API writes dates. */
const daysBefore = (date, days) => new Date(Date.parse(date) - days * 86_400_000).toISOString().slice(0, 10);

// Bench press done every Friday up to 16 October, a little heavier every few weeks: 25 sessions, newest first.
const benchSessions = Array.from({ length: 25 }, (_, week) => {
  const date = daysBefore('2026-10-16', 7 * week);
  const top = 82.5 - Math.floor(week / 2) * 2.5;

  return { workoutId: `workout-${date}`, date, workoutName: 'Chest and arms 2', sets: [[top - 2.5, 10], [top, 10], [top, 8]].map(([weightKg, reps]) => ({ weightKg, reps })) };
});
const sessionMonths = (sessions) =>
  [...new Set(sessions.map((session) => session.date.slice(0, 7)))].map((month) => ({
    month,
    sessions: benchSessions.filter((session) => session.date.startsWith(month)).length,
  }));
const benchPoints = (sessions) =>
  sessions
    .map((session) => ({ date: session.date, weightKg: Math.max(...session.sets.map((set) => set.weightKg)), reps: 10 }))
    .reverse();
// Each month's heaviest set since April 2021, for All, which shows months when there are many sessions.
const monthlyPoints = Array.from({ length: 67 }, (_, index) => {
  const month = new Date(Date.UTC(2021, 3 + index, 12));

  return { date: month.toISOString().slice(0, 10), weightKg: 50 + Math.round((index * 32.5) / 66 / 2.5) * 2.5, reps: 8 };
});

/** Bench press after 25 sessions: its details, its sessions a page at a time, and its chart for each range. */
const benchHistory = {
  details: {
    ...exerciseDetails(exercises[0], routines.filter((routine) => routine.name.startsWith('Chest')).map(({ id, name }) => ({ id, name }))),
    bestSet: { weightKg: 82.5, reps: 10, date: '2026-10-09' },
    timesDone: 25,
    firstDoneOn: benchSessions.at(-1).date,
  },
  firstPage: { sessions: benchSessions.slice(0, 20), months: sessionMonths(benchSessions.slice(0, 20)), nextCursor: benchSessions[19].date },
  lastPage: { sessions: benchSessions.slice(20), months: sessionMonths(benchSessions.slice(20)), nextCursor: null },
  progress: { byMonth: false, points: benchPoints(benchSessions.filter((session) => session.date >= '2026-08-07')) },
  allProgress: { byMonth: true, points: monthlyPoints },
};

// The same routine with each group's exercises next to each other, so they join into blocks.
const groupOrder = ['Chest', 'Biceps', 'Triceps'];
const chestAndArmsTogether = {
  ...chestAndArms,
  exercises: [...chestAndArms.exercises].sort((first, second) => groupOrder.indexOf(first.groupName) - groupOrder.indexOf(second.groupName)),
};

export const sample = {
  benchHistory,
  chestAndArmsTogether,
  benchPress: exercises[0],
  lateralRaise: exercises[6],
  chest,
  back,
  chestAndArms,
  exerciseDetails,
  routineList,
};
