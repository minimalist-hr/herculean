// The design's sample data, as the API would answer it, so every capture is the same.

const groups = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs'].map(
  (name) => ({ id: `group-${name.toLowerCase()}`, name }),
);
const [chest, back, shoulders, biceps, triceps, legs] = groups;

function exercise(name, group) {
  return {
    id: `exercise-${name.toLowerCase().replaceAll(' ', '-')}`,
    name,
    groupId: group.id,
    groupName: group.name,
    bestSet: null,
  };
}

const exercises = [
  exercise('Flat barbell bench press', chest),
  exercise('Incline dumbbell bench press', chest),
  exercise('Cable crossover', chest),
  exercise('Barbell row', back),
  exercise('Lat pulldown', back),
  exercise('Dumbbell shoulder press', shoulders),
  exercise('Cable lateral raise', shoulders),
  exercise('EZ bar bicep curl', biceps),
  exercise('Seated incline dumbbell curl', biceps),
  exercise('EZ bar skullcrusher', triceps),
  exercise('Straight bar pushdown', triceps),
  exercise('Barbell squat', legs),
  exercise('Leg press', legs),
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
      return { status: 200, body: { email: 'filip@example.com', name: 'Filip', units: 'metric', timeZone: 'Europe/Zagreb' } };
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

// The same routine with each group's exercises next to each other, so they join into blocks.
const groupOrder = ['Chest', 'Biceps', 'Triceps'];
const chestAndArmsTogether = {
  ...chestAndArms,
  exercises: [...chestAndArms.exercises].sort((first, second) => groupOrder.indexOf(first.groupName) - groupOrder.indexOf(second.groupName)),
};

export const sample = {
  chestAndArmsTogether,
  benchPress: exercises[0],
  lateralRaise: exercises[6],
  chest,
  back,
  chestAndArms,
  exerciseDetails,
  routineList,
};
