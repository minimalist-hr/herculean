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
  { id: chestAndArms.id, name: chestAndArms.name, exerciseCount: 7, setCount: 19, weekdays: ['monday'] },
  { id: 'routine-back-and-shoulders-1', name: 'Back and shoulders 1', exerciseCount: 6, setCount: 14, weekdays: ['tuesday'] },
  { id: 'routine-legs', name: 'Legs', exerciseCount: 4, setCount: 10, weekdays: ['wednesday'] },
  { id: 'routine-chest-and-arms-2', name: 'Chest and arms 2', exerciseCount: 7, setCount: 19, weekdays: ['friday'] },
  { id: 'routine-back-and-shoulders-2', name: 'Back and shoulders 2', exerciseCount: 6, setCount: 14, weekdays: ['saturday'] },
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

const sampleDays = {
  '2026-10-21': legsDay,
  '2026-10-22': sampleRestDay('2026-10-22', '2026-10-23', 'Chest and arms 2'),
  '2026-10-24': tomorrowDay,
  '2026-10-25': sampleRestDay('2026-10-25', '2026-10-26', 'Chest and arms 1'),
};

/** The design's sample week, with past days missed. */
export function sampleWeek(today, skippedDate) {
  return weekdays.map((weekday, index) => {
    const date = `2026-10-${String(19 + index)}`;
    const routine = routineList.find((item) => item.weekdays.includes(weekday));
    const planned = date < today ? 'missed' : 'planned';
    const status = routine === undefined ? 'rest' : date === skippedDate ? 'skipped' : planned;

    return { date, status, routineName: routine?.name ?? null };
  });
}

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
      return { status: 200, body: sampleWeek(sampleToday) };
    }
    if (method === 'GET' && path.startsWith('/api/v1/days/')) {
      return { status: 200, body: sampleDays[path.split('/')[4]] ?? { ...sampleDay, date: path.split('/')[4] } };
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
};
