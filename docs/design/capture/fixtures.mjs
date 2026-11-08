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
  exercise('Flat barbell bench press', chest, [82.5, 10, '2026-10-16']),
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
  exercise('Barbell squat', legs, [120, 5, '2026-10-21']),
  exercise('Leg press', legs, [200, 10, '2026-10-21']),
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

const routineList = [
  { id: chestAndArms.id, name: chestAndArms.name, exerciseCount: 7, setCount: 19, weekdays: ['monday'], lastDoneOn: '2026-10-19' },
  { id: 'routine-back-and-shoulders-1', name: 'Back and shoulders 1', exerciseCount: 6, setCount: 14, weekdays: ['tuesday'], lastDoneOn: '2026-10-20' },
  { id: 'routine-legs', name: 'Legs', exerciseCount: 4, setCount: 10, weekdays: ['wednesday'], lastDoneOn: '2026-10-14' },
  { id: 'routine-chest-and-arms-2', name: 'Chest and arms 2', exerciseCount: 7, setCount: 19, weekdays: ['friday'], lastDoneOn: '2026-10-16' },
  { id: 'routine-back-and-shoulders-2', name: 'Back and shoulders 2', exerciseCount: 6, setCount: 14, weekdays: ['saturday'], lastDoneOn: null },
];

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

/** A day on the design's sample week, as the API answers it. */
export const sampleDay = {
  date: '2026-10-23',
  status: 'planned',
  hasRoutines: true,
  workoutId: null,
  routine: {
    id: 'routine-chest-and-arms-2',
    name: 'Chest and arms 2',
    exercises: [...chestAndArms.exercises].sort((first, second) => first.groupName.localeCompare(second.groupName)),
  },
  upNext: { date: '2026-10-24', routineName: 'Back and shoulders 2' },
};

export const legsDay = {
  date: '2026-10-21',
  status: 'missed',
  hasRoutines: true,
  workoutId: null,
  routine: {
    id: 'routine-legs',
    name: 'Legs',
    exercises: [target('Barbell squat', 3, 8, 10), target('Leg press', 3, 10, 12)],
  },
  upNext: { date: '2026-10-22', routineName: null },
};

const tomorrowDay = {
  date: '2026-10-24',
  status: 'planned',
  hasRoutines: true,
  workoutId: null,
  routine: {
    id: 'routine-back-and-shoulders-2',
    name: 'Back and shoulders 2',
    exercises: [target('Barbell row', 3, 8, 10), target('Lat pulldown', 2, 10, 12), target('Dumbbell shoulder press', 3, 8, 10), target('Cable lateral raise', 2, 10, 12)],
  },
  upNext: { date: '2026-10-25', routineName: null },
};

const sampleRestDay = (date, nextDate, routineName) => ({
  date,
  status: 'rest',
  hasRoutines: true,
  workoutId: null,
  routine: null,
  upNext: { date: nextDate, routineName },
});

export const sampleDays = {
  '2026-10-21': legsDay,
  '2026-10-22': sampleRestDay('2026-10-22', '2026-10-23', 'Chest and arms 2'),
  '2026-10-24': tomorrowDay,
  '2026-10-25': sampleRestDay('2026-10-25', '2026-10-26', 'Chest and arms 1'),
};

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
  finishedAtUtc: '2026-10-23T17:04:10Z',
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
  records: [{ name: 'Flat barbell bench press', kind: 'heaviestWeight', weightKg: 80, reps: 10 }],
};

/** The design's sample week, with past days missed. */
export function sampleWeek(today, skippedDate, from = '2026-10-19') {
  return weekdays.map((weekday, index) => {
    const date = new Date(Date.parse(from) + index * 86_400_000).toISOString().slice(0, 10);
    const routine = routineList.find((item) => item.weekdays.includes(weekday));
    const planned = date < today ? 'missed' : 'planned';
    const status = routine === undefined ? 'rest' : date === skippedDate ? 'skipped' : planned;

    return { date, status, routineName: routine?.name ?? null };
  });
}

/** The design's sample month, with past days missed and 3 October skipped. */
export function sampleMonth(from, to) {
  const days = [];
  for (let time = Date.parse(from); time <= Date.parse(to); time += 86_400_000) {
    const date = new Date(time).toISOString().slice(0, 10);
    const weekday = weekdays[(new Date(time).getUTCDay() + 6) % 7];
    const routine = routineList.find((item) => item.weekdays.includes(weekday));
    const planned = date === '2026-10-03' ? 'skipped' : date < '2026-10-23' ? 'missed' : 'planned';

    days.push({ date, status: routine === undefined ? 'rest' : planned, routineName: routine?.name ?? null });
  }

  return days;
}

/** The sample month's summary. Done, time, checked sets and volume are zero until logging exists. */
export const sampleMonthSummary = {
  done: 0,
  missed: 14,
  skipped: 1,
  minutesTrained: 0,
  setsDone: 0,
  setsPlanned: 228,
  volumeKg: 0,
  plannedDays: 15,
  consistencyPercent: 0,
};

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
      const isMonth = Date.parse(query.get('to')) - Date.parse(query.get('from')) > 7 * 86_400_000;

      return { status: 200, body: isMonth ? sampleMonth(query.get('from'), query.get('to')) : sampleWeek(sampleToday, undefined, query.get('from')) };
    }
    if (method === 'GET' && path.startsWith('/api/v1/month-summaries/')) {
      return { status: 200, body: sampleMonthSummary };
    }
    if (key === 'GET /api/v1/days/first') {
      return { status: 200, body: { date: '2026-09-01' } };
    }
    if (method === 'GET' && path.startsWith('/api/v1/days/')) {
      return { status: 200, body: sampleDays[path.split('/')[4]] ?? { ...sampleDay, date: path.split('/')[4] } };
    }
    if (key === 'GET /api/v1/workout-settings') {
      return { status: 200, body: { defaultRestSeconds: 180, restSound: true, restVibrate: true } };
    }
    if (method === 'PATCH' && path.startsWith(`/api/v1/workouts/${sampleWorkout.id}/`)) {
      const exercise = sampleWorkout.exercises.find((item) => item.id === path.split('/')[6]);

      return { status: 200, body: exercise.sets.map((set) => (set.id === path.split('/')[8] ? { ...set, ...body } : set)) };
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
    ...exerciseDetails(exercises[0], [{ id: chestAndArms.id, name: chestAndArms.name }]),
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
