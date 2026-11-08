// Every built screen and state. A new one goes in the screen index after the one before it here.

import { legsDay, problem, sample, sampleDay, sampleDays, sampleSummary, sampleWeek, sampleWorkout, savedSummary, savedWorkout } from './fixtures.mjs';

const { benchHistory, benchPress, lateralRaise, chest, chestAndArms, chestAndArmsTogether, exerciseDetails, routineList } = sample;

const exercisePath = `/exercises/${lateralRaise.id}`;
const routinePath = `/routines/${chestAndArms.id}`;
const editPath = `/routine/${chestAndArms.id}/edit`;
const groupPath = `/exercises/groups/${chest.id}`;
const lists = (answer) => ({ 'GET /api/v1/exercises': answer });
const noGroups = { status: 200, body: [] };
const friday = '2026-10-23T18:00:00';
const sunday = '2026-10-25T18:00:00';
const skippedDay = (day) => ({ status: 200, body: { ...day, status: 'skipped', workoutId: 'workout-skipped' } });
const sundayWeek = { status: 200, body: sampleWeek('2026-10-25') };
const choosePath = '/workout/choose/2026-10-23';
const confirmRoutine = async (on) => {
  await on.go(choosePath);
  await on.tap('Chest and arms 1');
  await on.waitFor('Start Chest and arms 1?');
  await on.waitFor('Cable crossover');
};
const logPath = `/workout/log/${sampleWorkout.id}`;
const workoutPath = `GET /api/v1/workouts/${sampleWorkout.id}`;
// A workout in progress the day before, which keeps today's from starting.
const anotherInProgressAnswer = { 'GET /api/v1/workouts': { status: 200, body: [{ id: sampleWorkout.id, date: '2026-10-22', status: 'inProgress', name: 'Back and shoulders 1' }] } };
// The workout in progress, which shows the Resume bar.
const inProgressAnswer = { 'GET /api/v1/workouts': { status: 200, body: [{ id: sampleWorkout.id, date: '2026-10-23', status: 'inProgress', name: sampleWorkout.name }] } };
const addPath = `${logPath}/add`;
const newExercisePath = `${addPath}/new-exercise`;
const inclineDumbbellPress = sampleWorkout.exercises.find((exercise) => exercise.name === 'Incline dumbbell bench press');
const detailsPath = `/workout/details/${sampleWorkout.id}`;
const savedAnswers = {
  'GET /api/v1/days/2026-10-23': { status: 200, body: { ...sampleDay, status: 'completed', workoutId: sampleWorkout.id, routine: { ...sampleDay.routine, exercises: savedWorkout.exercises } } },
  [workoutPath]: { status: 200, body: savedWorkout },
  [`GET /api/v1/workouts/${sampleWorkout.id}/summary`]: { status: 200, body: savedSummary },
};
// A saved day whose workout can be deleted and put back, so the day then shows its plan.
const deletableAnswers = ({ restore } = {}) => {
  let deleted = false;

  return {
    ...savedAnswers,
    [`DELETE /api/v1/workouts/${sampleWorkout.id}`]: () => {
      deleted = true;
      return { status: 204 };
    },
    [`POST /api/v1/workouts/${sampleWorkout.id}/restore`]: () => {
      if (restore === 'fail') {
        return 'fail';
      }
      deleted = false;
      return { status: 200, body: { id: sampleWorkout.id, date: '2026-10-23', status: 'completed', name: sampleWorkout.name } };
    },
    'GET /api/v1/days/2026-10-23': () => (deleted ? { status: 200, body: sampleDay } : savedAnswers['GET /api/v1/days/2026-10-23']),
  };
};
const deleteFromToday = async (on) => {
  await on.go('/workout');
  await on.waitFor('View workout');
  await on.tap('Delete');
  await on.waitFor('Delete workout');
  await on.sleep(400);
};
const editFromToday = async (on) => {
  await on.go('/workout');
  await on.waitFor('View workout');
  await on.tap('Edit');
  await on.waitFor('Save workout');
  await on.sleep(400);
};
const editWorkoutPath = `/workout/edit/${sampleWorkout.id}`;
const pastSavedAnswers = {
  ...savedAnswers,
  'GET /api/v1/days/2026-10-20': { status: 200, body: { ...sampleDay, date: '2026-10-20', status: 'completed', workoutId: sampleWorkout.id, routine: { ...sampleDay.routine, name: 'Back and shoulders 1', exercises: savedWorkout.exercises } } },
  [`GET /api/v1/workouts/${sampleWorkout.id}/summary`]: { status: 200, body: { ...savedSummary, name: 'Back and shoulders 1', date: '2026-10-20', durationSeconds: 3130 } },
};
const finishPath = `${logPath}/finish`;
const summaryPath = `GET /api/v1/workouts/${sampleWorkout.id}/summary`;
const openFinish = async (on) => {
  await on.go(finishPath);
  await on.waitFor('Discard workout');
};
const openDiscard = async (on) => {
  await openFinish(on);
  await on.tap('Discard workout');
  await on.waitFor('Discard this workout?');
  await on.sleep(400);
};
const startSample = { 'POST /api/v1/workouts': { status: 201, body: { id: sampleWorkout.id, date: '2026-10-23', status: 'inProgress', name: sampleWorkout.name } } };
const discardFromToday = async (on) => {
  await on.go('/workout');
  await on.tap('Start workout');
  await on.tap('Finish');
  await on.waitFor('Discard workout');
  await on.tap('Discard workout');
  await on.waitFor('Discard this workout?');
  await on.sleep(400);
  await on.tap('Discard workout');
  await on.waitFor('Workout discarded.');
};
const openLog = async (on) => {
  await on.go(logPath);
  await on.waitFor('Add set');
};
const openRest = async (on) => {
  await openLog(on);
  await on.tap('Set 2 done');
  await on.waitFor('Start');
};
const startRest = async (on) => {
  await openRest(on);
  await on.tap('Start');
  await on.waitFor('Skip');
  await on.sleep(6000);
};
const restDay = (routineName) => ({ status: 200, body: { ...sampleDay, date: '2026-10-25', status: 'rest', routine: null, upNext: { date: '2026-10-26', routineName } } });

const openMonth = async (on) => {
  await on.go('/workout/month');
  await on.waitFor('Time trained');
  await on.sleep(500);
};
const openDayFromMonth = async (on, day) => {
  await openMonth(on);
  await on.tap(day);
};

const unfinishedUser = { 'GET /api/v1/users/me': { status: 200, body: { email: 'filip@example.com', name: null, units: 'metric', timeZone: 'Europe/Zagreb' } } };
const goToSetup = async (on) => {
  await on.type('Email', 'filip@example.com');
  await on.type('Password', 'password');
  await on.tap('Sign in');
  await on.type('Name', 'Filip');
  await on.tap('Finish setup');
};
const fillCreateAccount = async (on) => {
  await on.tap('Create account');
  await on.waitFor('Welcome to Herculean');
  await on.type('Email', 'filip@example.com');
  await on.type('Password', 'password');
  await on.type('Confirm password', 'password');
  await on.tap('Create account');
};
const fillResetPassword = async (on) => {
  await on.tap('Forgot password?');
  await on.type('Email', 'filip@example.com');
  await on.tap('Send reset link');
};
const linkSentPath = '/reset-link-sent?email=filip%40example.com';
const sendAgainWait = 61000;
const fillNewPassword = async (on) => {
  await on.go('/new-password?token=capture&email=filip%40example.com');
  await on.type('New password', 'password-one');
  await on.type('Confirm new password', 'password-one');
  await on.tap('Save password');
};
const skippedAnswers = { 'GET /api/v1/days': { status: 200, body: sampleWeek('2026-10-23', '2026-10-23') }, 'GET /api/v1/days/2026-10-23': skippedDay(sampleDay) };
const skipFromToday = async (on) => {
  await on.go('/workout');
  await on.tap('Skip workout');
  await on.waitFor('Skip Chest and arms 2?');
  await on.tap('Skip workout');
};
const undoFromToday = async (on) => {
  await on.go('/workout');
  await on.tap('Undo skip');
  await on.waitFor('Undo this skip?');
  await on.tap('Undo skip');
};
const editExercise = async (on) => {
  await on.go(exercisePath);
  await on.tap('Edit exercise');
  await on.type('Name', 'Lateral raise');
  await on.tap('Save exercise');
};
const deleteExercise = async (on) => {
  await on.tap('Exercises');
  await on.tap(lateralRaise.name);
  await on.tap('Delete exercise');
  await on.waitFor('Delete Cable lateral raise?');
  await on.tap('Delete exercise');
};
const emptyChest = { [`GET /api/v1/groups/${chest.id}`]: { status: 200, body: { ...chest, exerciseCount: 0, exercises: [], alsoWorksExercises: [] } } };
const newGroup = async (on) => {
  await on.tap('Exercises');
  await on.tap('Groups');
  await on.tap('New group');
  await on.waitFor('Save group');
  await on.type('Name', 'Core');
  await on.tap('Save group');
};
const editGroup = async (on) => {
  await on.go(groupPath);
  await on.tap('Edit group');
  await on.type('Name', 'Pecs');
  await on.tap('Save group');
};
const deleteGroup = async (on) => {
  await on.tap('Exercises');
  await on.tap('Groups');
  await on.tap('Chest, 3 exercises');
  await on.tap('Delete Chest');
  await on.waitFor('Delete Chest?');
  await on.tap('Delete group');
};
const editRoutine = async (on) => {
  await on.go(editPath);
  await on.type('Name', 'Upper body');
  await on.tap('Save routine');
};
const deleteRoutine = async (on) => {
  await on.tap('Routines');
  await on.tap('Chest and arms 1, 7 exercises · 19 sets');
  await on.tap('Delete routine');
  await on.waitFor('Delete Chest and arms 1?');
  await on.tap('Delete routine');
};
const lastWeek = async (on) => {
  await on.go('/workout');
  await on.waitFor('Start workout');
  await on.sleep(500);
  for (const _ of [1, 2, 3, 4]) {
    await on.swipe('This week', -200);
  }
};
const noPlannedDays = { done: 0, missed: 0, skipped: 0, minutesTrained: 0, setsDone: 0, setsPlanned: 0, volumeKg: 0, plannedDays: 0, consistencyPercent: null };

const benchId = `workout-${benchPress.id}`;
const benchPath = `/api/v1/workouts/${sampleWorkout.id}/exercises/${benchId}`;
const benchSets = sampleWorkout.exercises.find((exercise) => exercise.id === benchId).sets;
const workoutWith = (exercises) => ({ [workoutPath]: { status: 200, body: { ...sampleWorkout, exercises } } });
const withBenchSets = (sets) => workoutWith(sampleWorkout.exercises.map((exercise) => (exercise.id === benchId ? { ...exercise, sets } : exercise)));
const thirtyExercises = workoutWith(Array.from({ length: 30 }, (_, index) => ({ ...sampleWorkout.exercises[index % sampleWorkout.exercises.length], id: `workout-extra-${String(index)}` })));
const swapPath = `PATCH /api/v1/workouts/${sampleWorkout.id}/exercises/${inclineDumbbellPress.id}`;
const swapped = { status: 200, body: { ...sampleWorkout, exercises: sampleWorkout.exercises.map((exercise) => (exercise.id === inclineDumbbellPress.id ? { ...exercise, exerciseId: lateralRaise.id, name: lateralRaise.name, groupId: lateralRaise.groupId, groupName: lateralRaise.groupName } : exercise)) } };
const swapIncline = async (on) => {
  await openLog(on);
  await on.tap(`Open ${inclineDumbbellPress.name}`);
  await on.tap(`Swap ${inclineDumbbellPress.name}`);
  await on.tap('Shoulders');
  await on.tap(lateralRaise.name);
  await on.tap('Swap exercise');
};
const pickToAdd = async (on) => {
  await openLog(on);
  await on.tap('Add exercise');
  await on.waitFor('Pick the exercises to add to this workout.');
  await on.tap(lateralRaise.name);
};
const removeBench = async (on) => {
  await openLog(on);
  await on.tap('Remove Flat barbell bench press');
  await on.waitFor('Remove Flat barbell bench press?');
  await on.tap('Remove exercise');
};
const editBenchWeight = async (on) => {
  await openLog(on);
  await on.tap('Set 2 weight, 82.5 kilograms');
  await on.tap('5');
  await on.tap('Save set');
};
const fillNewExercise = async (on) => {
  await on.go('/exercise/new');
  await on.type('Name', 'Pistol squat');
  await on.tap('Legs');
  await on.tap('Save exercise');
};
const createRoutine = async (on) => {
  await on.tap('Routines');
  await on.tap('New routine');
  await on.type('Name', 'Upper body');
  await on.tap('Add exercise');
  await on.tap(benchPress.name);
  await on.tap('Add exercise');
  await on.tap('Save routine');
};
const openTargets = async (on) => {
  await on.go(editPath);
  await on.tap('Flat barbell bench press, 3 × 8–10');
  await on.waitFor('Sets and reps for this routine.');
};
const reorderPath = `${logPath}/reorder`;
const swapOnceThenFail = () => {
  let calls = 0;
  return () => (calls++ === 0 ? swapped : 'fail');
};

const benchExercisePath = `/exercises/${benchPress.id}`;
const benchApi = `/api/v1/exercises/${benchPress.id}`;
/** Bench press after 25 sessions, with any answers changed. */
const benchAnswers = (changes = {}) => ({
  [`GET ${benchApi}`]: { status: 200, body: benchHistory.details },
  [`GET ${benchApi}/sessions`]: (url) => ({ status: 200, body: url.searchParams.get('cursor') ? benchHistory.lastPage : benchHistory.firstPage }),
  [`GET ${benchApi}/progress`]: (url) => ({ status: 200, body: url.searchParams.get('range') === 'all' ? benchHistory.allProgress : benchHistory.progress }),
  ...changes,
});
const openBench = async (on) => {
  await on.go(benchExercisePath);
  await on.waitFor('Heaviest set');
};

export const screens = [
  // A · Account
  { id: 'A01', file: 'A01-Account-Sign-In', title: 'Account › Sign in', row: 'A1 Sign in', signedIn: false, steps: (on) => on.waitFor('Sign in') },
  { id: 'A03', file: 'A03-Account-Sign-In-Signing-In', title: 'Account › Sign in · signing in', row: 'A1 Sign in', signedIn: false, answers: { 'POST /api/v1/sessions': 'hold' }, steps: async (on) => {
    await on.type('Email', 'filip@example.com');
    await on.type('Password', 'password');
    await on.tap('Sign in');
  } },
  { id: 'A04', file: 'A04-Account-Sign-In-Errors', title: 'Account › Sign in · fields missing', row: 'A1 Sign in', signedIn: false, steps: (on) => on.tap('Sign in') },
  { id: 'A05', file: 'A05-Account-Sign-In-Wrong-Password', title: 'Account › Sign in · wrong email or password', row: 'A1 Sign in', signedIn: false, answers: { 'POST /api/v1/sessions': problem(401, 'user.invalid_credentials', 'Email or password is wrong.') }, steps: async (on) => {
    await on.type('Email', 'filip@example.com');
    await on.type('Password', 'wrong-password');
    await on.tap('Sign in');
  } },
  { id: 'A10', file: 'A10-Account-Reset-Password', title: 'Account › Reset password', row: 'A2 Reset password', signedIn: false, steps: (on) => on.tap('Forgot password?') },
  { id: 'A15', file: 'A15-Account-Reset-Password-Link-Expired', title: 'Account › Reset password · link expired', row: 'A2 Reset password', signedIn: false, steps: (on) => on.go('/forgot-password?linkExpired=true') },
  { id: 'A11', file: 'A11-Account-Reset-Link-Sent', title: 'Account › Reset password · link sent', row: 'A2 Reset password', signedIn: false, steps: async (on) => {
    await on.tap('Forgot password?');
    await on.type('Email', 'filip@example.com');
    await on.tap('Send reset link');
    await on.waitFor('Check your email');
  } },
  { id: 'A12', file: 'A12-Account-New-Password', title: 'Account › New password', row: 'A2 Reset password', signedIn: false, steps: (on) => on.go('/new-password?token=capture&email=filip%40example.com') },
  { id: 'A16', file: 'A16-Account-New-Password-Errors', title: 'Account › New password · passwords differ', row: 'A2 Reset password', signedIn: false, steps: async (on) => {
    await on.go('/new-password?token=capture&email=filip%40example.com');
    await on.type('New password', 'password-one');
    await on.type('Confirm new password', 'password-two');
    await on.tap('Save password');
  } },
  { id: 'A20', file: 'A20-Account-Create', title: 'Account › Create account', row: 'A3 Create account', signedIn: false, steps: (on) => on.tap('Create account') },
  { id: 'A21', file: 'A21-Account-Create-Errors', title: 'Account › Create account · fields missing', row: 'A3 Create account', signedIn: false, steps: async (on) => {
    await on.tap('Create account');
    await on.waitFor('Welcome to Herculean');
    await on.tap('Create account');
  } },
  { id: 'A22', file: 'A22-Account-Create-Email-Taken', title: 'Account › Create account · email taken', row: 'A3 Create account', signedIn: false, answers: { 'POST /api/v1/users': problem(409, 'user.email_taken', 'An account with this email already exists.') }, steps: async (on) => {
    await on.tap('Create account');
    await on.waitFor('Welcome to Herculean');
    await on.type('Email', 'filip@example.com');
    await on.type('Password', 'password');
    await on.type('Confirm password', 'password');
    await on.tap('Create account');
  } },
  { id: 'A30', file: 'A30-Account-Setup', title: 'Account › Setup', row: 'A3 Create account', signedIn: false, answers: { 'GET /api/v1/users/me': { status: 200, body: { email: 'filip@example.com', name: null, units: 'metric', timeZone: 'Europe/Zagreb' } } }, steps: async (on) => {
    await on.type('Email', 'filip@example.com');
    await on.type('Password', 'password');
    await on.tap('Sign in');
    await on.waitFor('Finish setup');
  } },
  { id: 'A31', file: 'A31-Account-Setup-Errors', title: 'Account › Setup · name missing', row: 'A3 Create account', signedIn: false, answers: { 'GET /api/v1/users/me': { status: 200, body: { email: 'filip@example.com', name: null, units: 'metric', timeZone: 'Europe/Zagreb' } } }, steps: async (on) => {
    await on.type('Email', 'filip@example.com');
    await on.type('Password', 'password');
    await on.tap('Sign in');
    await on.tap('Finish setup');
  } },
  { id: 'H20', file: 'H20-Settings-Terms', title: 'Settings › Terms of service', row: 'H3 About and legal', signedIn: false, steps: (on) => on.go('/terms') },
  { id: 'H21', file: 'H21-Settings-Privacy', title: 'Settings › Privacy policy', row: 'H3 About and legal', signedIn: false, steps: (on) => on.go('/privacy') },

  { id: 'A06', file: 'A06-Account-Sign-In-Failed', title: "Account › Sign in · couldn't sign in", row: 'A1 Sign in', signedIn: false, full: false, answers: { 'POST /api/v1/sessions': 'fail' }, steps: async (on) => {
    await on.type('Email', 'filip@example.com');
    await on.type('Password', 'password');
    await on.tap('Sign in');
    await on.waitFor("Couldn't sign in. Try again.");
  } },
  { id: 'A17', file: 'A17-Account-Reset-Password-Sending', title: 'Account › Reset password · sending', row: 'A2 Reset password', signedIn: false, answers: { 'POST /api/v1/password-resets': 'hold' }, steps: fillResetPassword },
  { id: 'A18', file: 'A18-Account-Reset-Password-Failed', title: "Account › Reset password · couldn't send", row: 'A2 Reset password', signedIn: false, full: false, answers: { 'POST /api/v1/password-resets': 'fail' }, steps: async (on) => {
    await fillResetPassword(on);
    await on.waitFor("Couldn't send the link. Try again.");
  } },
  { id: 'A19', file: 'A19-Account-Reset-Link-Send-Again', title: 'Account › Reset password · link can be sent again', row: 'A2 Reset password', signedIn: false, steps: async (on) => {
    await on.go(linkSentPath);
    await on.sleep(sendAgainWait);
    await on.waitFor('Send link again');
  } },
  { id: 'A50', file: 'A50-Account-Reset-Link-Sending-Again', title: 'Account › Reset password · sending again', row: 'A2 Reset password', signedIn: false, answers: { 'POST /api/v1/password-resets': 'hold' }, steps: async (on) => {
    await on.go(linkSentPath);
    await on.sleep(sendAgainWait);
    await on.tap('Send link again');
  } },
  { id: 'A51', file: 'A51-Account-Reset-Link-Sent-Again', title: 'Account › Reset password · link sent again', row: 'A2 Reset password', signedIn: false, full: false, steps: async (on) => {
    await on.go(linkSentPath);
    await on.sleep(sendAgainWait);
    await on.tap('Send link again');
    await on.waitFor('Link sent again.');
  } },
  { id: 'A52', file: 'A52-Account-Reset-Link-Send-Failed', title: "Account › Reset password · couldn't send again", row: 'A2 Reset password', signedIn: false, full: false, answers: { 'POST /api/v1/password-resets': 'fail' }, steps: async (on) => {
    await on.go(linkSentPath);
    await on.sleep(sendAgainWait);
    await on.tap('Send link again');
    await on.waitFor("Couldn't send the link. Try again.");
  } },
  { id: 'A53', file: 'A53-Account-New-Password-Saving', title: 'Account › New password · saving', row: 'A2 Reset password', signedIn: false, answers: { 'POST /api/v1/password-resets/complete': 'hold' }, steps: fillNewPassword },
  { id: 'A54', file: 'A54-Account-New-Password-Failed', title: "Account › New password · couldn't save", row: 'A2 Reset password', signedIn: false, full: false, answers: { 'POST /api/v1/password-resets/complete': 'fail' }, steps: async (on) => {
    await fillNewPassword(on);
    await on.waitFor("Couldn't save the password. Try again.");
  } },
  { id: 'A55', file: 'A55-Account-New-Password-Saved', title: 'Account › Sign in · password changed', row: 'A2 Reset password', signedIn: false, full: false, answers: { 'POST /api/v1/password-resets/complete': { status: 204 } }, steps: async (on) => {
    await fillNewPassword(on);
    await on.waitFor('Password changed. Sign in with the new one.');
  } },
  { id: 'A56', file: 'A56-Account-Reset-Password-Discard', title: 'Account › Reset password › Discard changes · confirm', row: 'A2 Reset password', signedIn: false, full: false, steps: async (on) => {
    await on.tap('Forgot password?');
    await on.waitFor('Send reset link');
    await on.sleep(500);
    await on.type('Email', 'filip@example.com');
    await on.tap('Sign in');
    await on.waitFor('Discard changes?');
    await on.sleep(400);
  } },
  { id: 'A57', file: 'A57-Account-New-Password-Link-Invalid', title: 'Account › New password · link no longer valid', row: 'A2 Reset password', signedIn: false, full: false, answers: { 'POST /api/v1/password-resets/complete': problem(404, 'user.invalid_password_reset_token', 'This link has expired. Send a new one.') }, steps: async (on) => {
    await fillNewPassword(on);
    await on.waitFor('This link has expired. Send a new one.');
  } },
  { id: 'A23', file: 'A23-Account-Create-Creating', title: 'Account › Create account · creating', row: 'A3 Create account', signedIn: false, answers: { 'POST /api/v1/users': 'hold' }, steps: fillCreateAccount },
  { id: 'A24', file: 'A24-Account-Create-Failed', title: "Account › Create account · couldn't create", row: 'A3 Create account', signedIn: false, full: false, answers: { 'POST /api/v1/users': 'fail' }, steps: async (on) => {
    await fillCreateAccount(on);
    await on.waitFor("Couldn't create the account. Try again.");
  } },
  { id: 'A25', file: 'A25-Account-Create-Discard', title: 'Account › Create account › Discard changes · confirm', row: 'A3 Create account', signedIn: false, full: false, steps: async (on) => {
    await on.tap('Create account');
    await on.waitFor('Welcome to Herculean');
    await on.type('Email', 'filip@example.com');
    await on.tap('Sign in');
    await on.waitFor('Discard changes?');
    await on.sleep(400);
  } },
  { id: 'A32', file: 'A32-Account-Setup-Finishing', title: 'Account › Setup · finishing', row: 'A3 Create account', signedIn: false, answers: { ...unfinishedUser, 'PATCH /api/v1/users/me': 'hold' }, steps: goToSetup },
  { id: 'A33', file: 'A33-Account-Setup-Failed', title: "Account › Setup · couldn't finish", row: 'A3 Create account', signedIn: false, full: false, answers: { ...unfinishedUser, 'PATCH /api/v1/users/me': 'fail' }, steps: async (on) => {
    await goToSetup(on);
    await on.waitFor("Couldn't finish setup. Try again.");
  } },
  { id: 'H00', file: 'H00-Home-Placeholder', title: 'Home · not planned yet', row: 'H1 Today states', steps: async (on) => {
    await on.go('/');
    await on.waitFor('Home');
  } },
  // W · Workout
  { id: 'W07', file: 'W07-Workout-Today-Loading', title: 'Workout › Today · loading', row: 'W1 Today states', today: friday, answers: { 'GET /api/v1/days/2026-10-23': 'hold', 'GET /api/v1/days': 'hold' }, steps: (on) => on.go('/workout') },
  { id: 'W08', file: 'W08-Workout-Today-Load-Failure', title: 'Workout › Today · load failure', row: 'W1 Today states', today: friday, answers: { 'GET /api/v1/days/2026-10-23': 'fail', 'GET /api/v1/days': 'fail' }, steps: async (on) => {
    await on.go('/workout');
    await on.waitFor('Try again');
  } },
  { id: 'W01', file: 'W01-Workout-Today', title: 'Workout › Today', row: 'W1 Today states', today: friday, steps: async (on) => {
    await on.go('/workout');
    await on.waitFor('Start workout');
  } },
  { id: 'W02', file: 'W02-Workout-Today-In-Progress', title: 'Workout › Today · in progress', row: 'W1 Today states', today: friday, answers: { ...inProgressAnswer, 'GET /api/v1/days/2026-10-23': { status: 200, body: { ...sampleDay, status: 'inProgress', workoutId: sampleWorkout.id } }, 'GET /api/v1/days': { status: 200, body: sampleWeek('2026-10-23').map((day) => (day.date === '2026-10-23' ? { ...day, status: 'inProgress' } : day)) } }, steps: async (on) => {
    await on.go('/workout');
    await on.waitFor('Resume workout');
  } },
  { id: 'W81', file: 'W81-Workout-Today-Resume-Bar-Hidden', title: 'Workout › Today · in progress, Resume bar hidden', row: 'W1 Today states', today: friday, full: false, answers: { ...inProgressAnswer, 'GET /api/v1/days/2026-10-23': { status: 200, body: { ...sampleDay, status: 'inProgress', workoutId: sampleWorkout.id } }, 'GET /api/v1/days': { status: 200, body: sampleWeek('2026-10-23').map((day) => (day.date === '2026-10-23' ? { ...day, status: 'inProgress' } : day)) } }, steps: async (on) => {
    await on.go('/workout');
    await on.waitFor('Resume workout');
    await on.tap('Hide workout bar');
    await on.sleep(300);
  } },
  { id: 'W06', file: 'W06-Workout-Today-Skipped', title: 'Workout › Today · skipped', row: 'W1 Today states', today: friday, answers: { 'GET /api/v1/days': { status: 200, body: sampleWeek('2026-10-23', '2026-10-23') }, 'GET /api/v1/days/2026-10-23': skippedDay(sampleDay) }, steps: async (on) => {
    await on.go('/workout');
    await on.waitFor('Undo skip');
  } },
  { id: 'W26', file: 'W26-Workout-Skip-Confirm', title: 'Workout › Skip workout · confirm', row: 'W1 Today states', today: friday, full: false, steps: async (on) => {
    await on.go('/workout');
    await on.tap('Skip workout');
    await on.waitFor('Skip Chest and arms 2?');
  } },
  { id: 'W27', file: 'W27-Workout-Undo-Skip-Confirm', title: 'Workout › Undo skip · confirm', row: 'W1 Today states', today: friday, full: false, answers: { 'GET /api/v1/days': { status: 200, body: sampleWeek('2026-10-23', '2026-10-23') }, 'GET /api/v1/days/2026-10-23': skippedDay(sampleDay) }, steps: async (on) => {
    await on.go('/workout');
    await on.tap('Undo skip');
    await on.waitFor('Undo this skip?');
  } },
  { id: 'W04', file: 'W04-Workout-Today-Rest-Day', title: 'Workout › Today · rest day', row: 'W1 Today states', today: sunday, answers: { 'GET /api/v1/days': sundayWeek, 'GET /api/v1/days/2026-10-25': restDay('Chest and arms 1') }, steps: async (on) => {
    await on.go('/workout');
    await on.waitFor('Rest day');
  } },
  { id: 'W09', file: 'W09-Workout-Today-Rest-Tomorrow', title: 'Workout › Today · rest tomorrow', row: 'W1 Today states', today: sunday, answers: { 'GET /api/v1/days': sundayWeek, 'GET /api/v1/days/2026-10-25': restDay(null) }, steps: async (on) => {
    await on.go('/workout');
    await on.waitFor('Rest day');
  } },
  { id: 'W23', file: 'W23-Workout-Yesterday-Rest-Day', title: 'Workout › Yesterday · rest day', row: 'W3 Other days', today: friday, steps: async (on) => {
    await on.go('/workout');
    await on.tap('Thursday 22, rest day');
    await on.waitFor('Rest day');
  } },
  { id: 'W21', file: 'W21-Workout-Missed-Day', title: 'Workout › Missed day', row: 'W3 Other days', today: friday, steps: async (on) => {
    await on.go('/workout');
    await on.tap('Wednesday 21, Legs, missed');
    await on.waitFor('Log workout');
  } },
  { id: 'W22', file: 'W22-Workout-Skipped-Day', title: 'Workout › Skipped day', row: 'W3 Other days', today: friday, answers: { 'GET /api/v1/days': { status: 200, body: sampleWeek('2026-10-23', '2026-10-21') }, 'GET /api/v1/days/2026-10-21': skippedDay(legsDay) }, steps: async (on) => {
    await on.go('/workout');
    await on.tap('Wednesday 21, Legs, skipped');
    await on.waitFor('Undo skip');
  } },
  { id: 'W24', file: 'W24-Workout-Upcoming-Day', title: 'Workout › Upcoming day · tomorrow', row: 'W3 Other days', today: friday, steps: async (on) => {
    await on.go('/workout');
    await on.tap('Saturday 24, Back and shoulders 2');
    await on.waitFor('Planned for Saturday');
  } },
  { id: 'W82', file: 'W82-Workout-Upcoming-Day-Not-Yet', title: 'Workout › Upcoming day · start says why', row: 'W3 Other days', today: friday, full: false, steps: async (on) => {
    await on.go('/workout');
    await on.tap('Saturday 24, Back and shoulders 2');
    await on.waitFor('Planned for Saturday');
    await on.tap('Start workout');
    await on.waitFor("A workout can't be started before its day.");
  } },
  { id: 'W25', file: 'W25-Workout-Rest-Day', title: 'Workout › Rest day', row: 'W3 Other days', today: friday, steps: async (on) => {
    await on.go('/workout');
    await on.tap('Sunday 25, rest day');
    await on.waitFor('Rest day');
  } },
  { id: 'W28', file: 'W28-Workout-Another-Week', title: 'Workout › Another week', row: 'W3 Other days', today: friday, answers: { 'GET /api/v1/days/2026-10-16': { status: 200, body: { ...legsDay, date: '2026-10-16' } } }, steps: async (on) => {
    await on.go('/workout');
    await on.waitFor('Start workout');
    await on.sleep(500);
    await on.swipe('Tuesday 20, Back and shoulders 1, missed', 200);
    await on.waitFor('16th October');
  } },
  { id: 'W05', file: 'W05-Workout-Today-No-Routines', title: 'Workout › Today · no routines yet', row: 'W1 Today states', today: friday, answers: { 'GET /api/v1/days/2026-10-23': { status: 200, body: { ...sampleDay, status: 'rest', hasRoutines: false, routine: null } } }, steps: async (on) => {
    await on.go('/workout');
    await on.waitFor('No routines yet');
  } },
  { id: 'W29', file: 'W29-Workout-Day-From-Month', title: 'Workout › Day from the month', row: 'W3 Other days', today: friday, steps: async (on) => {
    await openDayFromMonth(on, '21 October, Legs, missed');
    await on.tap('Open day');
    await on.waitFor('Back to month');
  } },
  { id: 'W41', file: 'W41-Workout-Month-Loading', title: 'Workout › Month · loading', row: 'W5 Month', today: friday, answers: { 'GET /api/v1/month-summaries/2026-10': 'hold', 'GET /api/v1/days': 'hold' }, steps: async (on) => {
    await on.go('/workout/month');
    await on.waitFor('October');
  } },
  { id: 'W40', file: 'W40-Workout-Month', title: 'Workout › Month', row: 'W5 Month', today: friday, steps: openMonth },
  { id: 'W43', file: 'W43-Workout-Month-Day-Missed', title: 'Workout › Month › Day summary · missed, sheet', row: 'W5 Month', today: friday, full: false, steps: async (on) => {
    await openDayFromMonth(on, '21 October, Legs, missed');
    await on.waitFor('Open day');
  } },
  { id: 'W44', file: 'W44-Workout-Month-Day-Skipped', title: 'Workout › Month › Day summary · skipped, sheet', row: 'W5 Month', today: friday, full: false, answers: { 'GET /api/v1/days/2026-10-03': { status: 200, body: { ...sampleDays['2026-10-24'], date: '2026-10-03', status: 'skipped', workoutId: 'workout-skipped' } } }, steps: async (on) => {
    await openDayFromMonth(on, '3 October, Back and shoulders 2, skipped');
    await on.waitFor('Open day');
  } },
  { id: 'W45', file: 'W45-Workout-Month-Day-Planned', title: 'Workout › Month › Day summary · planned, sheet', row: 'W5 Month', today: friday, full: false, steps: async (on) => {
    await openDayFromMonth(on, '24 October, Back and shoulders 2, planned');
    await on.waitFor('Open day');
  } },
  { id: 'W46', file: 'W46-Workout-Month-Day-Rest', title: 'Workout › Month › Day summary · rest day, sheet', row: 'W5 Month', today: friday, full: false, steps: async (on) => {
    await openDayFromMonth(on, '22 October, rest day');
    await on.waitFor('Open day');
  } },
  { id: 'W47', file: 'W47-Workout-Month-First', title: 'Workout › Month · first month', row: 'W5 Month', today: friday, answers: { 'GET /api/v1/days/first': { status: 200, body: { date: '2026-10-14' } } }, steps: openMonth },
  { id: 'W48', file: 'W48-Workout-Month-Day-Selected', title: 'Workout › Month · another day selected', row: 'W5 Month', today: friday, steps: async (on) => {
    await openDayFromMonth(on, '20 October, Back and shoulders 1, missed');
    await on.tap('Close');
    await on.sleep(400);
  } },
  { id: 'W49', file: 'W49-Workout-Month-Load-Failure', title: 'Workout › Month · load failure', row: 'W5 Month', today: friday, answers: { 'GET /api/v1/month-summaries/2026-10': 'fail' }, steps: async (on) => {
    await on.go('/workout/month');
    await on.waitFor("Couldn't load this month.");
  } },
  { id: 'W10', file: 'W10-Workout-Choose-Routine', title: 'Workout › Choose a routine', row: 'W2 Choose a routine', today: friday, steps: async (on) => {
    await on.go(choosePath);
    await on.waitFor('Chest and arms 1');
  } },
  { id: 'W11', file: 'W11-Workout-Choose-Routine-Loading', title: 'Workout › Choose a routine · loading', row: 'W2 Choose a routine', today: friday, answers: { 'GET /api/v1/routines': 'hold' }, steps: async (on) => {
    await on.go(choosePath);
    await on.waitFor('Loading your routines');
  } },
  { id: 'W57', file: 'W57-Workout-Choose-Routine-Confirm', title: 'Workout › Choose a routine · confirm', row: 'W2 Choose a routine', today: friday, full: false, steps: confirmRoutine },
  { id: 'W58', file: 'W58-Workout-Choose-Routine-Starting', title: 'Workout › Choose a routine · starting', row: 'W2 Choose a routine', today: friday, full: false, answers: { 'POST /api/v1/workouts': 'hold' }, steps: async (on) => {
    await confirmRoutine(on);
    await on.tap('Start workout');
    await on.waitFor('Starting workout');
  } },
  { id: 'W59', file: 'W59-Workout-Choose-Routine-Failed', title: "Workout › Choose a routine · couldn't start", row: 'W2 Choose a routine', today: friday, full: false, answers: { 'POST /api/v1/workouts': 'fail' }, steps: async (on) => {
    await confirmRoutine(on);
    await on.tap('Start workout');
    await on.waitFor("Couldn't start the workout. Try again.");
  } },
  { id: 'W60', file: 'W60-Workout-Choose-Routine-Empty', title: 'Workout › Choose a routine · nothing in the week plan', row: 'W2 Choose a routine', today: sunday, answers: { 'GET /api/v1/routines': { status: 200, body: routineList.map((routine) => ({ ...routine, weekdays: [] })) }, 'GET /api/v1/days/2026-10-25': restDay(null) }, steps: async (on) => {
    await on.go('/workout/choose/2026-10-25');
    await on.waitFor('No routines in your week plan');
  } },
  { id: 'W61', file: 'W61-Workout-Choose-Routine-Confirm-Loading', title: 'Workout › Choose a routine · confirm, loading', row: 'W2 Choose a routine', today: friday, full: false, answers: { [`GET /api/v1/routines/${chestAndArms.id}`]: 'hold' }, steps: async (on) => {
    await on.go(choosePath);
    await on.tap('Chest and arms 1');
    await on.waitFor('Start Chest and arms 1?');
  } },
  { id: 'W62', file: 'W62-Workout-Choose-Routine-Confirm-Failed', title: "Workout › Choose a routine · confirm, couldn't load", row: 'W2 Choose a routine', today: friday, full: false, answers: { [`GET /api/v1/routines/${chestAndArms.id}`]: 'fail' }, steps: async (on) => {
    await on.go(choosePath);
    await on.tap('Chest and arms 1');
    await on.waitFor("Couldn't load this routine.");
  } },
  { id: 'W63', file: 'W63-Workout-Choose-Routine-Load-Failure', title: 'Workout › Choose a routine · load failure', row: 'W2 Choose a routine', today: friday, answers: { 'GET /api/v1/routines': 'fail' }, steps: async (on) => {
    await on.go(choosePath);
    await on.waitFor("Couldn't load your routines.");
  } },
  { id: 'W64', file: 'W64-Workout-Other-Routine-Before-First-Day', title: 'Workout › Other routine · before the first day', row: 'W3 Other days', today: sunday, full: false, answers: { 'GET /api/v1/days/2026-10-25': restDay('Chest and arms 1'), 'GET /api/v1/days/first': { status: 200, body: { date: '2026-10-26' } } }, steps: async (on) => {
    await on.go('/workout');
    await on.waitFor('Rest day');
    await on.sleep(500);
    await on.tap('Other routine');
    await on.waitFor("A workout can't be added before your first day.");
  } },
  { id: 'W65', file: 'W65-Workout-Discarded-Undo', title: 'Workout › Workout discarded, with Undo', row: 'W1 Today states', today: friday, full: false, answers: startSample, steps: discardFromToday },
  { id: 'W66', file: 'W66-Workout-Undo-Discard-Failed', title: "Workout › Undo discard · couldn't undo", row: 'W1 Today states', today: friday, full: false, answers: { ...startSample, [`POST /api/v1/workouts/${sampleWorkout.id}/restore`]: 'fail' }, steps: async (on) => {
    await discardFromToday(on);
    await on.tap('Undo');
    await on.waitFor("Couldn't undo. Try again.");
  } },
  { id: 'W30', file: 'W30-Workout-Edit', title: 'Workout › Edit workout · full scroll', row: 'W4 Edit or delete a workout', today: friday, answers: savedAnswers, steps: editFromToday },
  { id: 'W31', file: 'W31-Workout-Edit-Set-Removed', title: 'Workout › Edit workout · set removed, undo bar', row: 'W4 Edit or delete a workout', today: friday, full: false, answers: savedAnswers, steps: async (on) => {
    await editFromToday(on);
    await on.tap('Set 1 reps, 12');
    await on.waitFor('Save set');
    await on.tap('Remove set');
    await on.waitFor('Set 1 removed.');
  } },
  { id: 'W32', file: 'W32-Workout-Delete-Confirm', title: 'Workout › Delete workout · confirm', row: 'W4 Edit or delete a workout', today: friday, full: false, answers: savedAnswers, steps: deleteFromToday },
  { id: 'W83', file: 'W83-Workout-Deleted-Undo', title: 'Workout › Workout deleted, with Undo', row: 'W4 Edit or delete a workout', today: friday, full: false, answers: deletableAnswers(), steps: async (on) => {
    await deleteFromToday(on);
    await on.tap('Delete workout');
    await on.waitFor('Workout deleted.');
    await on.waitFor('Start workout');
  } },
  { id: 'W84', file: 'W84-Workout-Delete-Failed', title: "Workout › Delete workout · couldn't delete", row: 'W4 Edit or delete a workout', today: friday, full: false, answers: { ...savedAnswers, [`DELETE /api/v1/workouts/${sampleWorkout.id}`]: { status: 500 } }, steps: async (on) => {
    await deleteFromToday(on);
    await on.tap('Delete workout');
    await on.waitFor("Couldn't delete the workout. Try again.");
  } },
  { id: 'W85', file: 'W85-Workout-Undo-Delete-Failed', title: "Workout › Undo delete · couldn't undo", row: 'W4 Edit or delete a workout', today: friday, full: false, answers: deletableAnswers({ restore: 'fail' }), steps: async (on) => {
    await deleteFromToday(on);
    await on.tap('Delete workout');
    await on.waitFor('Workout deleted.');
    await on.tap('Undo');
    await on.waitFor("Couldn't undo. Try again.");
  } },
  { id: 'W86', file: 'W86-Workout-Edit-Loading', title: 'Workout › Edit workout · loading', row: 'W4 Edit or delete a workout', today: friday, full: false, answers: { ...savedAnswers, [workoutPath]: 'hold' }, steps: async (on) => {
    await on.go(editWorkoutPath);
    await on.waitFor('Loading this workout');
  } },
  { id: 'W87', file: 'W87-Workout-Edit-Load-Failed', title: "Workout › Edit workout · couldn't load", row: 'W4 Edit or delete a workout', today: friday, full: false, answers: { ...savedAnswers, [workoutPath]: { status: 500 } }, steps: async (on) => {
    await on.go(editWorkoutPath);
    await on.waitFor("Couldn't load this workout.");
  } },
  { id: 'W88', file: 'W88-Workout-Edit-Saving', title: 'Workout › Edit workout · saving', row: 'W4 Edit or delete a workout', today: friday, full: false, answers: { ...savedAnswers, [`PUT /api/v1/workouts/${sampleWorkout.id}`]: 'hold' }, steps: async (on) => {
    await editFromToday(on);
    await on.tap('Save workout');
    await on.waitFor('Saving workout');
  } },
  { id: 'W89', file: 'W89-Workout-Edit-Save-Failed', title: "Workout › Edit workout · couldn't save", row: 'W4 Edit or delete a workout', today: friday, full: false, answers: { ...savedAnswers, [`PUT /api/v1/workouts/${sampleWorkout.id}`]: { status: 500 } }, steps: async (on) => {
    await editFromToday(on);
    await on.tap('Save workout');
    await on.waitFor("Couldn't save the workout. Try again.");
  } },
  { id: 'W90', file: 'W90-Workout-Edit-Leave', title: 'Workout › Edit workout · discard changes', row: 'W4 Edit or delete a workout', today: friday, full: false, answers: savedAnswers, steps: async (on) => {
    await editFromToday(on);
    await on.tap('Add set');
    await on.tap('Workout');
    await on.waitFor('Discard changes');
    await on.sleep(400);
  } },
  { id: 'W03', file: 'W03-Workout-Today-Completed', title: 'Workout › Today · completed', row: 'W1 Today states', today: friday, answers: savedAnswers, steps: async (on) => {
    await on.go('/workout');
    await on.waitFor('View workout');
    await on.sleep(400);
  } },
  { id: 'W20', file: 'W20-Workout-Past-Day', title: 'Workout › Past day', row: 'W3 Other days', today: friday, answers: pastSavedAnswers, steps: async (on) => {
    await on.go('/workout/day/2026-10-20');
    await on.waitFor('View workout');
    await on.sleep(400);
  } },
  { id: 'W42', file: 'W42-Workout-Month-Day-Sheet', title: 'Workout › Month › Day summary · sheet', row: 'W5 Month', today: friday, full: false, answers: pastSavedAnswers, steps: async (on) => {
    await openMonth(on);
    await on.tap('20 October, Back and shoulders 1, missed');
    await on.waitFor('View workout');
    await on.sleep(400);
  } },
  { id: 'W67', file: 'W67-Workout-Details', title: 'Workout › Workout details', row: 'W3 Other days', today: friday, answers: savedAnswers, steps: async (on) => {
    await on.go(detailsPath);
    await on.waitFor('Exercises');
    await on.sleep(400);
  } },
  { id: 'W71', file: 'W71-Workout-Details-From-Month', title: 'Workout › Workout details · from the month', row: 'W3 Other days', today: friday, answers: savedAnswers, steps: async (on) => {
    await on.go(`${detailsPath}?from=month`);
    await on.waitFor('Exercises');
    await on.sleep(400);
  } },
  { id: 'W68', file: 'W68-Workout-Details-Loading', title: 'Workout › Workout details · loading', row: 'W3 Other days', today: friday, answers: { ...savedAnswers, [`GET /api/v1/workouts/${sampleWorkout.id}/summary`]: 'hold', [workoutPath]: 'hold' }, steps: async (on) => {
    await on.go(detailsPath);
    await on.waitFor('Duration');
    await on.sleep(400);
  } },
  { id: 'W69', file: 'W69-Workout-Details-Load-Failure', title: 'Workout › Workout details · load failure', row: 'W3 Other days', today: friday, answers: { ...savedAnswers, [workoutPath]: 'fail', [summaryPath]: 'fail' }, steps: async (on) => {
    await on.go(detailsPath);
    await on.waitFor("Couldn't load the exercises.");
  } },
  { id: 'W70', file: 'W70-Workout-Today-Completed-Load-Failure', title: 'Workout › Today · completed, load failure', row: 'W1 Today states', today: friday, answers: { ...savedAnswers, [workoutPath]: 'fail' }, steps: async (on) => {
    await on.go('/workout');
    await on.waitFor("Couldn't load this workout.");
  } },
  { id: 'W13', file: 'W13-Workout-Skip-Skipping', title: 'Workout › Skip workout · skipping', row: 'W1 Today states', today: friday, full: false, answers: { 'POST /api/v1/workouts': 'hold' }, steps: skipFromToday },
  { id: 'W14', file: 'W14-Workout-Skip-Failed', title: "Workout › Skip workout · couldn't skip", row: 'W1 Today states', today: friday, full: false, answers: { 'POST /api/v1/workouts': 'fail' }, steps: async (on) => {
    await skipFromToday(on);
    await on.waitFor("Couldn't skip the workout. Try again.");
  } },
  { id: 'W15', file: 'W15-Workout-Undo-Skip-Undoing', title: 'Workout › Undo skip · undoing', row: 'W1 Today states', today: friday, full: false, answers: { ...skippedAnswers, 'DELETE /api/v1/workouts/workout-skipped': 'hold' }, steps: undoFromToday },
  { id: 'W16', file: 'W16-Workout-Undo-Skip-Failed', title: "Workout › Undo skip · couldn't undo", row: 'W1 Today states', today: friday, full: false, answers: { ...skippedAnswers, 'DELETE /api/v1/workouts/workout-skipped': 'fail' }, steps: async (on) => {
    await undoFromToday(on);
    await on.waitFor("Couldn't undo. Try again.");
  } },
  { id: 'W17', file: 'W17-Workout-First-Week', title: 'Workout › Today · first week, no earlier weeks', row: 'W3 Other days', today: friday, answers: { 'GET /api/v1/days/first': { status: 200, body: { date: '2026-10-19' } } }, steps: async (on) => {
    await on.go('/workout');
    await on.waitFor('Start workout');
    await on.sleep(500);
  } },
  { id: 'W18', file: 'W18-Workout-Last-Week', title: 'Workout › Upcoming day · last week, no later weeks', row: 'W3 Other days', today: friday, steps: lastWeek },
  { id: 'W19', file: 'W19-Workout-Another-Year', title: 'Workout › Day in another year', row: 'W3 Other days', today: friday, steps: async (on) => {
    await on.go('/workout/day/2025-10-20');
    await on.waitFor('Back to month');
  } },
  { id: 'W50', file: 'W50-Workout-Month-Another-Month', title: 'Workout › Month · another month', row: 'W5 Month', today: friday, steps: async (on) => {
    await openMonth(on);
    await on.swipe('15 October, rest day', 200);
    await on.waitFor('September');
    await on.sleep(500);
  } },
  { id: 'W51', file: 'W51-Workout-Month-Last', title: 'Workout › Month · last month, a later day says why', row: 'W5 Month', today: friday, full: false, steps: async (on) => {
    await openMonth(on);
    await on.swipe('15 October, rest day', -200);
    await on.waitFor('November');
    await on.sleep(500);
    await on.tap('30 November, Chest and arms 1, planned');
    await on.waitFor('Days reach 4 weeks ahead.');
  } },
  { id: 'W52', file: 'W52-Workout-Month-First-Says-Why', title: 'Workout › Month · first month, an earlier day says why', row: 'W5 Month', today: friday, full: false, answers: { 'GET /api/v1/days/first': { status: 200, body: { date: '2026-10-14' } } }, steps: async (on) => {
    await openMonth(on);
    await on.tap('1 October, rest day');
    await on.waitFor('Your first day is Wed, 14th Oct.');
  } },
  { id: 'W53', file: 'W53-Workout-Month-Nothing-Planned', title: 'Workout › Month · nothing planned yet', row: 'W5 Month', today: friday, answers: { 'GET /api/v1/month-summaries/2026-10': { status: 200, body: noPlannedDays } }, steps: openMonth },
  { id: 'W54', file: 'W54-Workout-Month-Day-Today', title: 'Workout › Month › Day summary · today, sheet', row: 'W5 Month', today: friday, full: false, steps: async (on) => {
    await openDayFromMonth(on, '23 October, Chest and arms 2, today');
    await on.waitFor('Open day');
  } },
  { id: 'W55', file: 'W55-Workout-Month-Day-Loading', title: 'Workout › Month › Day summary · loading, sheet', row: 'W5 Month', today: friday, full: false, answers: { 'GET /api/v1/days/2026-10-21': 'hold' }, steps: async (on) => {
    await openDayFromMonth(on, '21 October, Legs, missed');
    await on.waitFor('Open day');
  } },
  { id: 'W56', file: 'W56-Workout-Month-Day-Load-Failure', title: 'Workout › Month › Day summary · load failure, sheet', row: 'W5 Month', today: friday, full: false, answers: { 'GET /api/v1/days/2026-10-21': 'fail' }, steps: async (on) => {
    await openDayFromMonth(on, '21 October, Legs, missed');
    await on.waitFor('Try again');
  } },
  { id: 'W72', file: 'W72-Workout-Today-Starting', title: 'Workout › Today · starting', row: 'W1 Today states', today: friday, answers: { 'POST /api/v1/workouts': 'hold' }, steps: async (on) => {
    await on.go('/workout');
    await on.tap('Start workout');
    await on.waitFor('Starting workout');
  } },
  { id: 'W73', file: 'W73-Workout-Today-Start-Failed', title: "Workout › Today · couldn't start", row: 'W1 Today states', today: friday, full: false, answers: { 'POST /api/v1/workouts': 'fail' }, steps: async (on) => {
    await on.go('/workout');
    await on.tap('Start workout');
    await on.waitFor("Couldn't start the workout. Try again.");
  } },
  { id: 'W74', file: 'W74-Workout-Today-Another-In-Progress', title: 'Workout › Today · another workout in progress', row: 'W1 Today states', today: friday, full: false, answers: anotherInProgressAnswer, steps: async (on) => {
    await on.go('/workout');
    await on.waitFor('Resume');
    await on.tap('Start workout');
    await on.waitFor('Resume or finish your workout first.');
  } },
  { id: 'W80', file: 'W80-Workout-Today-Start-Muted', title: 'Workout › Today · another workout in progress, start muted · full scroll', row: 'W1 Today states', today: friday, answers: anotherInProgressAnswer, steps: async (on) => {
    await on.go('/workout');
    await on.waitFor('Resume');
  } },
  { id: 'W75', file: 'W75-Workout-Today-Week-Loading', title: 'Workout › Today · week strip loading', row: 'W1 Today states', today: friday, answers: { 'GET /api/v1/days': 'hold' }, steps: async (on) => {
    await on.go('/workout');
    await on.waitFor('Start workout');
  } },
  { id: 'W79', file: 'W79-Workout-Today-Week-Load-Failure', title: 'Workout › Today · week strip load failure', row: 'W1 Today states', today: friday, answers: { 'GET /api/v1/days': 'fail' }, steps: async (on) => {
    await on.go('/workout');
    await on.waitFor("Couldn't load the week.");
  } },
  { id: 'W76', file: 'W76-Workout-Month-Day-In-Progress', title: 'Workout › Month › Day summary · in progress, sheet', row: 'W5 Month', today: friday, full: false, answers: { 'GET /api/v1/days/2026-10-21': { status: 200, body: { ...legsDay, status: 'inProgress', workoutId: sampleWorkout.id } } }, steps: async (on) => {
    await openDayFromMonth(on, '21 October, Legs, missed');
    await on.waitFor('Open day');
  } },
  { id: 'W77', file: 'W77-Workout-Month-Day-Completed-Loading', title: 'Workout › Month › Day summary · completed, loading, sheet', row: 'W5 Month', today: friday, full: false, answers: { ...pastSavedAnswers, [workoutPath]: 'hold', [summaryPath]: 'hold' }, steps: async (on) => {
    await openMonth(on);
    await on.tap('20 October, Back and shoulders 1, missed');
    await on.sleep(600);
  } },
  { id: 'W78', file: 'W78-Workout-Month-Day-Completed-Load-Failure', title: 'Workout › Month › Day summary · completed, load failure, sheet', row: 'W5 Month', today: friday, full: false, answers: { ...pastSavedAnswers, [workoutPath]: 'fail' }, steps: async (on) => {
    await openMonth(on);
    await on.tap('20 October, Back and shoulders 1, missed');
    await on.waitFor('Try again');
  } },
  // E · Exercises
  { id: 'E02', file: 'E02-Exercises-Loading', title: 'Exercises · loading', row: 'E1 Exercises tab', answers: { ...lists('hold'), 'GET /api/v1/groups': 'hold' }, steps: (on) => on.go('/exercises') },
  { id: 'E01', file: 'E01-Exercises', title: 'Exercises', row: 'E1 Exercises tab', steps: async (on) => {
    await on.go('/exercises');
    await on.waitFor(benchPress.name);
  } },
  { id: 'E03', file: 'E03-Exercises-No-Matches', title: 'Exercises · no search matches', row: 'E1 Exercises tab', steps: async (on) => {
    await on.go('/exercises');
    await on.waitFor(benchPress.name);
    await on.type('Search exercises', 'Pistol squat');
    await on.sleep(600);
  }, answers: {} },
  { id: 'E04', file: 'E04-Exercises-Empty', title: 'Exercises · no exercises yet', row: 'E1 Exercises tab', answers: lists({ status: 200, body: [] }), steps: (on) => on.go('/exercises') },
  { id: 'E05', file: 'E05-Exercises-Load-Failure', title: 'Exercises · load failure', row: 'E1 Exercises tab', answers: lists('fail'), steps: async (on) => {
    await on.go('/exercises');
    await on.waitFor('Try again');
  } },
  { id: 'E06', file: 'E06-Exercises-Deleted-Undo', title: 'Exercises · exercise deleted, with Undo', row: 'E1 Exercises tab', full: false, steps: async (on) => {
    await on.tap('Exercises');
    await on.tap(lateralRaise.name);
    await on.tap('Delete exercise');
    await on.tap('Delete exercise');
    await on.waitFor('Undo');
  } },
  { id: 'E10', file: 'E10-Exercises-Detail', title: 'Exercises › Exercise', row: 'E2 Exercise details', answers: benchAnswers(), steps: async (on) => {
    await openBench(on);
    await on.waitFor('70 → 82.5 kg');
  } },
  { id: 'E11', file: 'E11-Exercises-Detail-Never-Done', title: 'Exercises › Exercise · never done', row: 'E2 Exercise details', steps: async (on) => {
    await on.go(exercisePath);
    await on.waitFor('Used in');
  } },
  { id: 'E12', file: 'E12-Exercises-Detail-In-Routines', title: 'Exercises › Exercise · in routines, trash says why', row: 'E2 Exercise details', answers: { [`GET /api/v1/exercises/${benchPress.id}`]: { status: 200, body: exerciseDetails(benchPress, [{ id: 'a', name: 'Chest and arms 1' }, { id: 'b', name: 'Chest and arms 2' }]) } }, steps: async (on) => {
    await on.go(`/exercises/${benchPress.id}`);
    await on.tap('Delete exercise, not available while it is in a routine');
  } },
  { id: 'E13', file: 'E13-Exercises-Detail-Loading', title: 'Exercises › Exercise · loading', row: 'E2 Exercise details', answers: { [`GET /api/v1/exercises/${lateralRaise.id}`]: 'hold' }, steps: (on) => on.go(exercisePath) },
  { id: 'E14', file: 'E14-Exercises-Detail-Load-Failure', title: 'Exercises › Exercise · load failure', row: 'E2 Exercise details', answers: { [`GET /api/v1/exercises/${lateralRaise.id}`]: 'fail' }, steps: async (on) => {
    await on.go(exercisePath);
    await on.waitFor('Try again');
  } },
  { id: 'E17', file: 'E17-Exercises-Detail-Loading-More', title: 'Exercises › Exercise · loading more sessions', row: 'E2 Exercise details', full: false, answers: benchAnswers({ [`GET ${benchApi}/sessions`]: (url) => (url.searchParams.get('cursor') ? 'hold' : { status: 200, body: benchHistory.firstPage }) }), steps: async (on) => {
    await openBench(on);
    await on.end();
    await on.waitFor('Loading more sessions');
    await on.end();
  } },
  { id: 'E18', file: 'E18-Exercises-Detail-Load-More-Failure', title: "Exercises › Exercise · couldn't load more sessions", row: 'E2 Exercise details', full: false, answers: benchAnswers({ [`GET ${benchApi}/sessions`]: (url) => (url.searchParams.get('cursor') ? 'fail' : { status: 200, body: benchHistory.firstPage }) }), steps: async (on) => {
    await openBench(on);
    await on.end();
    await on.waitFor("Couldn't load more sessions.");
    await on.end();
  } },
  { id: 'E19', file: 'E19-Exercises-Detail-Sessions-Loading', title: 'Exercises › Exercise · sessions loading', row: 'E2 Exercise details', answers: benchAnswers({ [`GET ${benchApi}/sessions`]: 'hold' }), steps: async (on) => {
    await openBench(on);
    await on.waitFor('70 → 82.5 kg');
  } },
  { id: 'E67', file: 'E67-Exercises-Detail-Chart-Loading', title: 'Exercises › Exercise · chart loading', row: 'E2 Exercise details', full: false, answers: benchAnswers({ [`GET ${benchApi}/progress`]: 'hold' }), steps: openBench },
  { id: 'E68', file: 'E68-Exercises-Detail-Chart-Load-Failure', title: "Exercises › Exercise · chart couldn't load", row: 'E2 Exercise details', full: false, answers: benchAnswers({ [`GET ${benchApi}/progress`]: 'fail' }), steps: async (on) => {
    await openBench(on);
    await on.waitFor("Couldn't load the chart.");
  } },
  { id: 'E69', file: 'E69-Exercises-Detail-Chart-Empty', title: 'Exercises › Exercise · no sessions in this period', row: 'E2 Exercise details', full: false, answers: benchAnswers({ [`GET ${benchApi}/progress`]: { status: 200, body: { byMonth: false, points: [] } } }), steps: async (on) => {
    await openBench(on);
    await on.waitFor('No sessions in this period');
  } },
  { id: 'E70', file: 'E70-Exercises-Detail-Chart-By-Month', title: 'Exercises › Exercise · All, by month', row: 'E2 Exercise details', full: false, answers: benchAnswers(), steps: async (on) => {
    await openBench(on);
    await on.tap('All time');
    await on.waitFor('50 → 82.5 kg');
  } },
  { id: 'E20', file: 'E20-Exercises-Edit', title: 'Exercises › Edit exercise', row: 'E3 Edit or delete', steps: async (on) => {
    await on.go(exercisePath);
    await on.tap('Edit exercise');
    await on.waitFor('Save exercise');
  } },
  { id: 'E22', file: 'E22-Exercises-Edit-Name-Taken', title: 'Exercises › Edit exercise · name taken', row: 'E3 Edit or delete', answers: { [`PUT /api/v1/exercises/${lateralRaise.id}`]: problem(409, 'exercise.name_taken', 'You already have an exercise with this name.') }, steps: async (on) => {
    await on.go(exercisePath);
    await on.tap('Edit exercise');
    await on.type('Name', 'Leg press');
    await on.tap('Save exercise');
  } },
  { id: 'E23', file: 'E23-Exercises-Edit-Discard', title: 'Exercises › Edit exercise › Discard changes · confirm', row: 'E3 Edit or delete', full: false, steps: async (on) => {
    await on.go(exercisePath);
    await on.tap('Edit exercise');
    await on.type('Name', 'Lateral raise');
    await on.tap('Cable lateral raise');
    await on.waitFor('Discard changes?');
  } },
  { id: 'E21', file: 'E21-Exercises-Delete-Confirm', title: 'Exercises › Delete exercise · confirm', row: 'E3 Edit or delete', full: false, steps: async (on) => {
    await on.go(exercisePath);
    await on.tap('Delete exercise');
    await on.waitFor('Delete Cable lateral raise?');
  } },
  { id: 'E31', file: 'E31-Exercises-Groups-Loading', title: 'Exercises › Groups · loading', row: 'E4 Groups', answers: { 'GET /api/v1/groups': 'hold' }, steps: (on) => on.go('/exercises/groups') },
  { id: 'E30', file: 'E30-Exercises-Groups', title: 'Exercises › Groups', row: 'E4 Groups', steps: async (on) => {
    await on.go('/exercises/groups');
    await on.waitFor('New group');
  } },
  { id: 'E36', file: 'E36-Exercises-Groups-Empty', title: 'Exercises › Groups · no groups yet', row: 'E4 Groups', answers: { 'GET /api/v1/groups': noGroups }, steps: (on) => on.go('/exercises/groups') },
  { id: 'E37', file: 'E37-Exercises-Groups-Load-Failure', title: 'Exercises › Groups · load failure', row: 'E4 Groups', answers: { 'GET /api/v1/groups': 'fail' }, steps: async (on) => {
    await on.go('/exercises/groups');
    await on.waitFor('Try again');
  } },
  { id: 'E33', file: 'E33-Exercises-Groups-Edit', title: 'Exercises › Groups › Edit group', row: 'E4 Groups', steps: async (on) => {
    await on.go(groupPath);
    await on.tap('Edit group');
    await on.waitFor('Save group');
  } },
  { id: 'E32', file: 'E32-Exercises-Groups-New', title: 'Exercises › Groups › New group', row: 'E4 Groups', steps: (on) => on.go('/group/new') },
  { id: 'E38', file: 'E38-Exercises-Groups-New-Name-Taken', title: 'Exercises › Groups › New group · name taken', row: 'E4 Groups', answers: { 'POST /api/v1/groups': problem(409, 'group.name_taken', 'You already have a group with this name.') }, steps: async (on) => {
    await on.go('/group/new');
    await on.type('Name', 'Chest');
    await on.tap('Save group');
  } },
  { id: 'E34', file: 'E34-Exercises-Groups-Delete-Confirm', title: 'Exercises › Groups › Delete group · confirm', row: 'E4 Groups', full: false, answers: { [`GET /api/v1/groups/${chest.id}`]: { status: 200, body: { ...chest, exercises: [], alsoWorksExercises: [] } } }, steps: async (on) => {
    await on.go(groupPath);
    await on.tap('Delete Chest');
    await on.waitFor('Delete Chest?');
  } },
  { id: 'E39', file: 'E39-Exercises-Groups-Deleted-Undo', title: 'Exercises › Groups · group deleted, with Undo', row: 'E4 Groups', full: false, answers: { [`GET /api/v1/groups/${chest.id}`]: { status: 200, body: { ...chest, exercises: [], alsoWorksExercises: [] } } }, steps: async (on) => {
    await on.tap('Exercises');
    await on.tap('Groups');
    await on.tap('Chest, 3 exercises');
    await on.tap('Delete Chest');
    await on.tap('Delete group');
    await on.waitFor('Undo');
  } },
  { id: 'E35', file: 'E35-Exercises-Groups-Group', title: 'Exercises › Groups › Group', row: 'E4 Groups', steps: async (on) => {
    await on.go(groupPath);
    await on.waitFor(benchPress.name);
  } },
  { id: 'E40', file: 'E40-Exercises-Groups-Group-Trash-Muted', title: 'Exercises › Groups › Group · trash says why', row: 'E4 Groups', steps: async (on) => {
    await on.go(groupPath);
    await on.waitFor(benchPress.name);
    await on.tap('Delete Chest, not available while it has exercises');
  } },
  { id: 'E41', file: 'E41-Exercises-Groups-Group-Empty', title: 'Exercises › Groups › Group · no exercises', row: 'E4 Groups', answers: { [`GET /api/v1/groups/${chest.id}`]: { status: 200, body: { ...chest, exercises: [], alsoWorksExercises: [] } } }, steps: async (on) => {
    await on.go(groupPath);
    await on.waitFor('Delete Chest');
  } },

  { id: 'E07', file: 'E07-Exercises-Empty-Group', title: 'Exercises · no exercises in this group', row: 'E1 Exercises tab', answers: { 'GET /api/v1/exercises': (url) => (url.searchParams.get('groupId') ? { status: 200, body: [] } : undefined) }, steps: async (on) => {
    await on.go('/exercises');
    await on.waitFor(benchPress.name);
    await on.tap('Chest');
    await on.sleep(600);
  } },
  { id: 'E08', file: 'E08-Exercises-New', title: 'Exercises › New exercise', row: 'E1 Exercises tab', steps: async (on) => {
    await on.go('/exercise/new');
    await on.waitFor('Save exercise');
  } },
  { id: 'E09', file: 'E09-Exercises-Created', title: 'Exercises · exercise created', row: 'E1 Exercises tab', full: false, steps: async (on) => {
    await on.go('/exercise/new');
    await on.type('Name', 'Pistol squat');
    await on.tap('Legs');
    await on.tap('Save exercise');
    await on.waitFor('Pistol squat created.');
  } },
  { id: 'E15', file: 'E15-Exercises-Edit-Loading', title: 'Exercises › Edit exercise · loading', row: 'E3 Edit or delete', answers: { [`GET /api/v1/exercises/${lateralRaise.id}`]: 'hold' }, steps: async (on) => {
    await on.go(`/exercise/${lateralRaise.id}/edit`);
    await on.sleep(400);
  } },
  { id: 'E16', file: 'E16-Exercises-Edit-Load-Failure', title: 'Exercises › Edit exercise · load failure', row: 'E3 Edit or delete', answers: { [`GET /api/v1/exercises/${lateralRaise.id}`]: 'fail' }, steps: async (on) => {
    await on.go(`/exercise/${lateralRaise.id}/edit`);
    await on.waitFor('Try again');
  } },
  { id: 'E24', file: 'E24-Exercises-Edit-Saving', title: 'Exercises › Edit exercise · saving', row: 'E3 Edit or delete', answers: { [`PUT /api/v1/exercises/${lateralRaise.id}`]: 'hold' }, steps: editExercise },
  { id: 'E25', file: 'E25-Exercises-Edit-Failed', title: "Exercises › Edit exercise · couldn't save", row: 'E3 Edit or delete', full: false, answers: { [`PUT /api/v1/exercises/${lateralRaise.id}`]: 'fail' }, steps: async (on) => {
    await editExercise(on);
    await on.waitFor("Couldn't save the exercise. Try again.");
  } },
  { id: 'E26', file: 'E26-Exercises-Edit-Saved', title: 'Exercises › Exercise · saved', row: 'E3 Edit or delete', full: false, answers: { [`PUT /api/v1/exercises/${lateralRaise.id}`]: { status: 200, body: { ...lateralRaise, name: 'Lateral raise' } } }, steps: async (on) => {
    await editExercise(on);
    await on.waitFor('Lateral raise saved.');
  } },
  { id: 'E27', file: 'E27-Exercises-Delete-Deleting', title: 'Exercises › Delete exercise · deleting', row: 'E3 Edit or delete', full: false, answers: { [`DELETE /api/v1/exercises/${lateralRaise.id}`]: 'hold' }, steps: deleteExercise },
  { id: 'E28', file: 'E28-Exercises-Delete-Failed', title: "Exercises › Delete exercise · couldn't delete", row: 'E3 Edit or delete', full: false, answers: { [`DELETE /api/v1/exercises/${lateralRaise.id}`]: 'fail' }, steps: async (on) => {
    await deleteExercise(on);
    await on.waitFor("Couldn't delete the exercise. Try again.");
  } },
  { id: 'E29', file: 'E29-Exercises-Undo-Failed', title: "Exercises · couldn't undo a delete", row: 'E1 Exercises tab', full: false, answers: { [`POST /api/v1/exercises/${lateralRaise.id}/restore`]: 'fail' }, steps: async (on) => {
    await deleteExercise(on);
    await on.tap('Undo');
    await on.waitFor("Couldn't undo. Try again.");
  } },
  { id: 'E42', file: 'E42-Exercises-Groups-No-Matches', title: 'Exercises › Groups · no search matches', row: 'E4 Groups', steps: async (on) => {
    await on.go('/exercises/groups');
    await on.waitFor('New group');
    await on.type('Search groups', 'Core');
    await on.sleep(600);
  } },
  { id: 'E43', file: 'E43-Exercises-Groups-Dragging', title: 'Exercises › Groups · dragging a group', row: 'E4 Groups', full: false, steps: async (on) => {
    await on.go('/exercises/groups');
    await on.waitFor('New group');
    await on.sleep(500);
    await on.hold('Move Chest', 90);
  } },
  { id: 'E44', file: 'E44-Exercises-Groups-Order-Failed', title: "Exercises › Groups · couldn't save the order", row: 'E4 Groups', full: false, answers: { 'PUT /api/v1/group-order': 'fail' }, steps: async (on) => {
    await on.go('/exercises/groups');
    await on.waitFor('New group');
    await on.sleep(500);
    await on.hold('Move Chest', 90);
    await on.release();
    await on.waitFor("Couldn't save the order. Try again.");
  } },
  { id: 'E45', file: 'E45-Exercises-Groups-New-Saving', title: 'Exercises › Groups › New group · saving', row: 'E4 Groups', answers: { 'POST /api/v1/groups': 'hold' }, steps: newGroup },
  { id: 'E46', file: 'E46-Exercises-Groups-New-Failed', title: "Exercises › Groups › New group · couldn't save", row: 'E4 Groups', full: false, answers: { 'POST /api/v1/groups': 'fail' }, steps: async (on) => {
    await newGroup(on);
    await on.waitFor("Couldn't save the group. Try again.");
  } },
  { id: 'E47', file: 'E47-Exercises-Groups-Created', title: 'Exercises › Groups · group created', row: 'E4 Groups', full: false, answers: { 'POST /api/v1/groups': { status: 201, body: { ...chest, id: 'group-core', name: 'Core' } } }, steps: async (on) => {
    await newGroup(on);
    await on.waitFor('Core created.');
  } },
  { id: 'E48', file: 'E48-Exercises-Groups-Edit-Saved', title: 'Exercises › Groups › Group · saved', row: 'E4 Groups', full: false, answers: { [`PATCH /api/v1/groups/${chest.id}`]: { status: 200, body: { ...chest, name: 'Pecs' } } }, steps: async (on) => {
    await editGroup(on);
    await on.waitFor('Pecs saved.');
  } },
  { id: 'E49', file: 'E49-Exercises-Groups-Group-Loading', title: 'Exercises › Groups › Group · loading', row: 'E4 Groups', answers: { [`GET /api/v1/groups/${chest.id}`]: 'hold' }, steps: async (on) => {
    await on.go(groupPath);
    await on.sleep(400);
  } },
  { id: 'E50', file: 'E50-Exercises-Groups-Group-Load-Failure', title: 'Exercises › Groups › Group · load failure', row: 'E4 Groups', answers: { [`GET /api/v1/groups/${chest.id}`]: 'fail' }, steps: async (on) => {
    await on.go(groupPath);
    await on.waitFor('Try again');
  } },
  { id: 'E51', file: 'E51-Exercises-Groups-Edit-Loading', title: 'Exercises › Groups › Edit group · loading', row: 'E4 Groups', answers: { [`GET /api/v1/groups/${chest.id}`]: 'hold' }, steps: async (on) => {
    await on.go(`/group/${chest.id}/edit`);
    await on.sleep(400);
  } },
  { id: 'E52', file: 'E52-Exercises-Groups-Edit-Load-Failure', title: 'Exercises › Groups › Edit group · load failure', row: 'E4 Groups', answers: { [`GET /api/v1/groups/${chest.id}`]: 'fail' }, steps: async (on) => {
    await on.go(`/group/${chest.id}/edit`);
    await on.waitFor('Try again');
  } },
  { id: 'E53', file: 'E53-Exercises-Groups-Delete-Deleting', title: 'Exercises › Groups › Delete group · deleting', row: 'E4 Groups', full: false, answers: { ...emptyChest, [`DELETE /api/v1/groups/${chest.id}`]: 'hold' }, steps: deleteGroup },
  { id: 'E54', file: 'E54-Exercises-Groups-Delete-Failed', title: "Exercises › Groups › Delete group · couldn't delete", row: 'E4 Groups', full: false, answers: { ...emptyChest, [`DELETE /api/v1/groups/${chest.id}`]: 'fail' }, steps: async (on) => {
    await deleteGroup(on);
    await on.waitFor("Couldn't delete the group. Try again.");
  } },
  { id: 'E55', file: 'E55-Exercises-Groups-Undo-Failed', title: "Exercises › Groups · couldn't undo a delete", row: 'E4 Groups', full: false, answers: { ...emptyChest, [`POST /api/v1/groups/${chest.id}/restore`]: 'fail' }, steps: async (on) => {
    await deleteGroup(on);
    await on.tap('Undo');
    await on.waitFor("Couldn't undo. Try again.");
  } },
  { id: 'E56', file: 'E56-Exercises-No-Groups', title: 'Exercises · no groups, New exercise says why', row: 'E1 Exercises tab', full: false, answers: { 'GET /api/v1/groups': noGroups, ...lists({ status: 200, body: [] }) }, steps: async (on) => {
    await on.go('/exercises');
    await on.tap('New exercise');
    await on.waitFor('Create a group first.');
  } },
  { id: 'E57', file: 'E57-Exercises-Groups-Loading', title: 'Exercises · groups still loading', row: 'E1 Exercises tab', answers: { 'GET /api/v1/groups': 'hold' }, steps: async (on) => {
    await on.go('/exercises');
    await on.waitFor(benchPress.name);
  } },
  { id: 'E58', file: 'E58-Exercises-New-Limit-Reached', title: 'Exercises › New exercise · limit reached', row: 'E1 Exercises tab', full: false, answers: { 'POST /api/v1/exercises': problem(409, 'exercise.limit_reached', "You've reached the limit of 500 exercises.") }, steps: async (on) => {
    await fillNewExercise(on);
    await on.waitFor("You've reached the limit of 500 exercises.");
  } },
  { id: 'E59', file: 'E59-Exercises-New-Name-Taken', title: 'Exercises › New exercise · name taken', row: 'E1 Exercises tab', answers: { 'POST /api/v1/exercises': problem(409, 'exercise.name_taken', 'You already have an exercise with this name.') }, steps: async (on) => {
    await fillNewExercise(on);
    await on.waitFor('You already have an exercise with this name.');
  } },
  { id: 'E60', file: 'E60-Exercises-New-Saving', title: 'Exercises › New exercise · saving', row: 'E1 Exercises tab', answers: { 'POST /api/v1/exercises': 'hold' }, steps: fillNewExercise },
  { id: 'E61', file: 'E61-Exercises-New-Failed', title: "Exercises › New exercise · couldn't save", row: 'E1 Exercises tab', full: false, answers: { 'POST /api/v1/exercises': 'fail' }, steps: async (on) => {
    await fillNewExercise(on);
    await on.waitFor("Couldn't save the exercise. Try again.");
  } },
  { id: 'E62', file: 'E62-Exercises-New-Discard', title: 'Exercises › New exercise › Discard changes · confirm', row: 'E1 Exercises tab', full: false, steps: async (on) => {
    await on.go('/exercises');
    await on.tap('New exercise');
    await on.type('Name', 'Pistol squat');
    await on.tap('Exercises');
    await on.waitFor('Discard changes?');
    await on.sleep(400);
  } },
  { id: 'E63', file: 'E63-Exercises-New-Groups-Loading', title: 'Exercises › New exercise · groups loading', row: 'E1 Exercises tab', answers: { 'GET /api/v1/groups': 'hold' }, steps: async (on) => {
    await on.go('/exercise/new');
    await on.waitFor('Save exercise');
  } },
  { id: 'E64', file: 'E64-Exercises-Groups-New-Name-Missing', title: 'Exercises › Groups › New group · name missing', row: 'E4 Groups', steps: async (on) => {
    await on.go('/group/new');
    await on.tap('Save group');
    await on.waitFor('Enter a name.');
  } },
  { id: 'E65', file: 'E65-Exercises-Groups-New-Discard', title: 'Exercises › Groups › New group › Discard changes · confirm', row: 'E4 Groups', full: false, steps: async (on) => {
    await on.tap('Exercises');
    await on.tap('Groups');
    await on.tap('New group');
    await on.type('Name', 'Core');
    await on.tap('Groups');
    await on.waitFor('Discard changes?');
    await on.sleep(400);
  } },
  { id: 'E66', file: 'E66-Exercises-Groups-Group-Not-Done', title: 'Exercises › Groups › Group · not done yet', row: 'E4 Groups', answers: { [`GET /api/v1/groups/${chest.id}`]: { status: 200, body: { ...chest, exerciseCount: 1, exercises: [{ ...benchPress, bestSet: null }], alsoWorksExercises: [] } } }, steps: async (on) => {
    await on.go(groupPath);
    await on.waitFor('No sessions yet');
  } },
  // L · Add exercise, reached from a routine
  { id: 'L03', file: 'L03-Logging-Loading', title: 'Logging › Loading', row: 'L1 Log sets', today: friday, answers: { [workoutPath]: 'hold' }, steps: async (on) => {
    await on.go(logPath);
    await on.waitFor('Loading this workout');
  } },
  { id: 'L05', file: 'L05-Logging-Load-Failure', title: 'Logging › Load failure', row: 'L1 Log sets', today: friday, answers: { [workoutPath]: 'fail' }, steps: async (on) => {
    await on.go(logPath);
    await on.waitFor("Couldn't load this workout.");
  } },
  { id: 'L01', file: 'L01-Logging', title: 'Logging', row: 'L1 Log sets', today: friday, steps: openLog },
  { id: 'L06', file: 'L06-Logging-Rest-Ready', title: 'Logging › Rest · ready', row: 'L1 Log sets', today: friday, full: false, steps: openRest },
  { id: 'L07', file: 'L07-Logging-Rest-Running', title: 'Logging › Rest · running', row: 'L1 Log sets', today: friday, full: false, steps: startRest },
  { id: 'L08', file: 'L08-Logging-Rest-Hidden', title: 'Logging › Rest · hidden', row: 'L1 Log sets', today: friday, full: false, steps: async (on) => {
    await startRest(on);
    await on.tap('Hide rest timer');
    await on.sleep(300);
  } },
  { id: 'L09', file: 'L09-Logging-Rest-Over', title: 'Logging › Rest · over', row: 'L1 Log sets', today: friday, full: false, steps: async (on) => {
    await openRest(on);
    await on.tap('Start');
    for (let tap = 0; tap < 12; tap += 1) {
      await on.tap('Subtract 15 seconds');
    }
    await on.waitFor('Done');
    await on.sleep(3000);
  } },
  { id: 'L10', file: 'L10-Logging-Edit-Weight', title: 'Logging › Edit weight · sheet', row: 'L1 Log sets', today: friday, full: false, steps: async (on) => {
    await openLog(on);
    await on.tap('Set 2 weight, 82.5 kilograms');
    await on.waitFor('Save set');
    await on.sleep(400);
  } },
  { id: 'L11', file: 'L11-Logging-Edit-Reps', title: 'Logging › Edit reps · sheet', row: 'L1 Log sets', today: friday, full: false, steps: async (on) => {
    await openLog(on);
    await on.tap('Set 2 reps, 10');
    await on.waitFor('Save set');
    await on.sleep(400);
  } },
  { id: 'L12', file: 'L12-Logging-Set-Removed', title: 'Logging › Set removed · undo bar', row: 'L1 Log sets', today: friday, answers: { [`DELETE /api/v1/workouts/${sampleWorkout.id}/exercises/workout-${sampleWorkout.exercises.find((exercise) => exercise.name === 'Flat barbell bench press').exerciseId}/sets/workout-${sampleWorkout.exercises.find((exercise) => exercise.name === 'Flat barbell bench press').exerciseId}-set-2`]: { status: 204 } }, steps: async (on) => {
    await openLog(on);
    await on.tap('Set 3 weight, 82.5 kilograms');
    await on.waitFor('Save set');
    await on.tap('Remove set');
    await on.waitFor('Set 3 removed.');
    await on.sleep(400);
  } },
  { id: 'L04', file: 'L04-Logging-Reorder', title: 'Logging › Reorder exercises', row: 'L1 Log sets', today: friday, steps: async (on) => {
    await on.go(`${logPath}/reorder`);
    await on.waitFor('Reorder exercises');
  } },
  { id: 'L13', file: 'L13-Logging-Remove-Exercise-Confirm', title: 'Logging › Remove exercise · confirm', row: 'L2 Exercises', today: friday, full: false, steps: async (on) => {
    await openLog(on);
    await on.tap('Remove Flat barbell bench press');
    await on.waitFor('Remove exercise');
    await on.sleep(400);
  } },
  { id: 'L30', file: 'L30-Logging-Finish', title: 'Logging › Finish workout', row: 'L3 Finish', today: friday, steps: openFinish },
  { id: 'L31', file: 'L31-Logging-Finish-Nothing-Logged', title: 'Logging › Finish workout · nothing logged', row: 'L3 Finish', today: friday, answers: { [summaryPath]: { status: 200, body: { ...sampleSummary, durationSeconds: 400, setsChecked: 0, setsTotal: 19, volumeKg: 0, uncheckedExercises: [], records: [] } } }, steps: openFinish },
  { id: 'L32', file: 'L32-Logging-Finish-Past-Day', title: 'Logging › Finish workout · past day, every set checked', row: 'L3 Finish', today: friday, answers: { [summaryPath]: { status: 200, body: { ...sampleSummary, date: '2026-10-20', durationSeconds: null, setsChecked: 19, setsTotal: 19, volumeKg: 10260, uncheckedExercises: [], records: [] } } }, steps: openFinish },
  { id: 'L33', file: 'L33-Logging-Discard-Confirm', title: 'Logging › Discard workout · confirm', row: 'L3 Finish', today: friday, full: false, steps: openDiscard },
  { id: 'L34', file: 'L34-Logging-Finish-Loading', title: 'Logging › Finish workout · loading', row: 'L3 Finish', today: friday, answers: { [summaryPath]: 'hold' }, steps: async (on) => {
    await on.go(finishPath);
    await on.waitFor('Finish workout');
    await on.sleep(400);
  } },
  { id: 'L35', file: 'L35-Logging-Finish-Load-Failure', title: 'Logging › Finish workout · load failure', row: 'L3 Finish', today: friday, answers: { [summaryPath]: 'fail' }, steps: async (on) => {
    await on.go(finishPath);
    await on.waitFor("Couldn't load this workout.");
  } },
  { id: 'L36', file: 'L36-Logging-Finish-Saving', title: 'Logging › Finish workout · saving', row: 'L3 Finish', today: friday, answers: { [`PATCH /api/v1/workouts/${sampleWorkout.id}`]: 'hold' }, steps: async (on) => {
    await openFinish(on);
    await on.tap('Save workout');
    await on.waitFor('Saving workout');
  } },
  { id: 'L37', file: 'L37-Logging-Finish-Failed', title: "Logging › Finish workout · couldn't save", row: 'L3 Finish', today: friday, answers: { [`PATCH /api/v1/workouts/${sampleWorkout.id}`]: 'fail' }, steps: async (on) => {
    await openFinish(on);
    await on.tap('Save workout');
    await on.waitFor("Couldn't save the workout. Try again.");
  } },
  { id: 'L38', file: 'L38-Logging-Discard-Discarding', title: 'Logging › Discard workout · discarding', row: 'L3 Finish', today: friday, full: false, answers: { [`DELETE /api/v1/workouts/${sampleWorkout.id}`]: 'hold' }, steps: async (on) => {
    await openDiscard(on);
    await on.tap('Discard workout');
    await on.waitFor('Discarding workout');
  } },
  { id: 'L39', file: 'L39-Logging-Discard-Failed', title: "Logging › Discard workout · couldn't discard", row: 'L3 Finish', today: friday, full: false, answers: { [`DELETE /api/v1/workouts/${sampleWorkout.id}`]: 'fail' }, steps: async (on) => {
    await openDiscard(on);
    await on.tap('Discard workout');
    await on.waitFor("Couldn't discard the workout. Try again.");
  } },
  { id: 'L29', file: 'L29-Logging-Swap-Exercise', title: 'Logging › Swap exercise', row: 'L2 Exercises', today: friday, steps: async (on) => {
    await on.go(`${addPath}?swap=${inclineDumbbellPress.id}`);
    await on.waitFor('Swap exercise');
    await on.sleep(600);
    await on.tap('Shoulders');
    await on.waitFor(lateralRaise.name);
    await on.tap(lateralRaise.name);
  } },
  { id: 'L16', file: 'L16-Logging-Swap-Checked-Says-Why', title: 'Logging › Swap · checked sets say why', row: 'L2 Exercises', today: friday, full: false, steps: async (on) => {
    await openLog(on);
    await on.tap('Swap Flat barbell bench press');
    await on.waitFor("An exercise with checked sets can't be swapped. Uncheck them first.");
  } },
  { id: 'L20', file: 'L20-Logging-Add-Exercise', title: 'Logging › Add exercise', row: 'L2 Exercises', steps: async (on) => {
    await on.go(addPath);
    await on.waitFor(lateralRaise.name);
    await on.tap(lateralRaise.name);
  } },
  { id: 'L24', file: 'L24-Logging-Add-Exercise-Loading', title: 'Logging › Add exercise · loading', row: 'L2 Exercises', full: false, answers: { ...lists('hold'), 'GET /api/v1/groups': 'hold' }, steps: (on) => on.go(addPath) },
  { id: 'L25', file: 'L25-Logging-Add-Exercise-Load-Failure', title: 'Logging › Add exercise · load failure', row: 'L2 Exercises', answers: lists('fail'), steps: async (on) => {
    await on.go(addPath);
    await on.waitFor('Try again');
  } },
  { id: 'L21', file: 'L21-Logging-Add-Exercise-No-Matches', title: 'Logging › Add exercise · no matches', row: 'L2 Exercises', steps: async (on) => {
    await on.go(addPath);
    await on.waitFor(lateralRaise.name);
    await on.sleep(1000);
    await on.type('Search exercises', 'Pistol squat');
    await on.sleep(600);
  } },
  { id: 'L23', file: 'L23-Logging-Add-Exercise-New-Selected', title: 'Logging › Add exercise · new one selected', row: 'L2 Exercises', steps: async (on) => {
    await on.go(addPath);
    await on.waitFor(lateralRaise.name);
    await on.sleep(1000);
    await on.type('Search exercises', 'Pistol squat');
    await on.sleep(600);
    await on.tap('New exercise');
    await on.waitFor('Save exercise');
    await on.tap('Legs');
    await on.tap('Save exercise');
    await on.waitFor('Add exercise');
    await on.sleep(600);
    await on.tap('Legs');
    await on.waitFor('Pistol squat');
  } },
  { id: 'L22', file: 'L22-Logging-New-Exercise', title: 'Logging › New exercise', row: 'L2 Exercises', steps: (on) => on.go(newExercisePath) },
  { id: 'L26', file: 'L26-Logging-New-Exercise-Errors', title: 'Logging › New exercise · fields missing', row: 'L2 Exercises', steps: async (on) => {
    await on.go(newExercisePath);
    await on.tap('Save exercise');
  } },
  { id: 'L27', file: 'L27-Logging-Add-Exercise-No-Groups', title: 'Logging › Add exercise · no groups, New exercise says why', row: 'L2 Exercises', answers: { 'GET /api/v1/groups': noGroups, ...lists({ status: 200, body: [] }) }, steps: async (on) => {
    await on.go(addPath);
    await on.tap('New exercise');
  } },

  { id: 'L28', file: 'L28-Logging-Add-Exercise-Pick-First', title: 'Logging › Add exercise · nothing picked says why', row: 'L2 Exercises', full: false, steps: async (on) => {
    await on.go(addPath);
    await on.waitFor(lateralRaise.name);
    await on.tap('Add exercise');
    await on.waitFor('Pick an exercise first.');
  } },
  { id: 'L02', file: 'L02-Logging-No-Exercises', title: 'Logging · no exercises left', row: 'L3 Finish', today: friday, answers: { [workoutPath]: { status: 200, body: { ...sampleWorkout, exercises: [] } } }, steps: async (on) => {
    await on.go(logPath);
    await on.waitFor('No exercises left');
  } },
  { id: 'L40', file: 'L40-Logging-Exercise-Limit', title: 'Logging · 30 exercises, Add exercise says why', row: 'L1 Log sets', today: friday, full: false, answers: thirtyExercises, steps: async (on) => {
    await openLog(on);
    await on.end();
    await on.tap('Add exercise');
    await on.waitFor('A workout can have at most 30 exercises.');
  } },
  { id: 'L41', file: 'L41-Logging-Set-Limit', title: 'Logging · 20 sets, Add set says why', row: 'L1 Log sets', today: friday, full: false, answers: withBenchSets(Array.from({ length: 20 }, (_, order) => ({ ...benchSets[1], id: `${benchId}-set-${String(order)}`, order }))), steps: async (on) => {
    await on.go(logPath);
    await on.waitFor('Finish');
    await on.end();
    await on.tap('Add set');
    await on.waitFor('An exercise can have at most 20 sets.');
  } },
  { id: 'L42', file: 'L42-Logging-Reps-Whole-Numbers', title: 'Logging › Edit reps · decimal point says why', row: 'L1 Log sets', today: friday, full: false, steps: async (on) => {
    await openLog(on);
    await on.tap('Set 2 reps, 10');
    await on.tap('Decimal point');
    await on.waitFor('Reps are whole numbers.');
  } },
  { id: 'L43', file: 'L43-Logging-Weight-Out-Of-Range', title: 'Logging › Edit weight · out of range, Save says why', row: 'L1 Log sets', today: friday, full: false, steps: async (on) => {
    await openLog(on);
    await on.tap('Set 2 weight, 82.5 kilograms');
    for (const _ of [1, 2, 3, 4]) {
      await on.tap('9');
    }
    await on.tap('Save set');
    await on.sleep(600);
  } },
  { id: 'L44', file: 'L44-Logging-Only-Set', title: 'Logging › Edit weight · only set, Remove says why', row: 'L1 Log sets', today: friday, full: false, answers: withBenchSets([{ ...benchSets[1], order: 0 }]), steps: async (on) => {
    await openLog(on);
    await on.tap('Set 1 weight, 82.5 kilograms');
    await on.tap('Remove set');
    await on.waitFor("An exercise keeps at least one set. Use the exercise's trash to remove it.");
  } },
  { id: 'L45', file: 'L45-Logging-Saving-Set', title: 'Logging › Edit weight · saving set', row: 'L1 Log sets', today: friday, full: false, answers: { [`PATCH ${benchPath}/sets/${benchId}-set-1`]: 'hold' }, steps: async (on) => {
    await editBenchWeight(on);
    await on.waitFor('Saving set');
  } },
  { id: 'L46', file: 'L46-Logging-Save-Set-Failed', title: "Logging · couldn't save a set", row: 'L1 Log sets', today: friday, full: false, answers: { [`PATCH ${benchPath}/sets/${benchId}-set-1`]: 'fail' }, steps: async (on) => {
    await editBenchWeight(on);
    await on.waitFor("Couldn't save the set. Try again.");
  } },
  { id: 'L47', file: 'L47-Logging-Add-Set-Failed', title: "Logging · couldn't add a set", row: 'L1 Log sets', today: friday, full: false, answers: { [`POST ${benchPath}/sets`]: 'fail' }, steps: async (on) => {
    await openLog(on);
    await on.tap('Add set');
    await on.waitFor("Couldn't add the set. Try again.");
  } },
  { id: 'L48', file: 'L48-Logging-Remove-Set-Failed', title: "Logging · couldn't remove a set", row: 'L1 Log sets', today: friday, full: false, answers: { [`DELETE ${benchPath}/sets/${benchId}-set-2`]: 'fail' }, steps: async (on) => {
    await openLog(on);
    await on.tap('Set 3 weight, 82.5 kilograms');
    await on.tap('Remove set');
    await on.waitFor("Couldn't remove the set. Try again.");
  } },
  { id: 'L49', file: 'L49-Logging-Undo-Set-Failed', title: "Logging · couldn't bring the set back", row: 'L1 Log sets', today: friday, full: false, answers: { [`DELETE ${benchPath}/sets/${benchId}-set-2`]: { status: 204 }, [`POST ${benchPath}/sets`]: 'fail' }, steps: async (on) => {
    await openLog(on);
    await on.tap('Set 3 weight, 82.5 kilograms');
    await on.tap('Remove set');
    await on.tap('Undo');
    await on.waitFor("Couldn't bring the set back. Try again.");
  } },
  { id: 'L60', file: 'L60-Logging-Reorder-Loading', title: 'Logging › Reorder exercises · loading', row: 'L1 Log sets', today: friday, answers: { [workoutPath]: 'hold' }, steps: (on) => on.go(reorderPath) },
  { id: 'L61', file: 'L61-Logging-Reorder-Load-Failure', title: 'Logging › Reorder exercises · load failure', row: 'L1 Log sets', today: friday, answers: { [workoutPath]: 'fail' }, steps: async (on) => {
    await on.go(reorderPath);
    await on.waitFor('Try again');
  } },
  { id: 'L62', file: 'L62-Logging-Reorder-Dragging', title: 'Logging › Reorder exercises · dragging', row: 'L1 Log sets', today: friday, full: false, steps: async (on) => {
    await on.go(reorderPath);
    await on.hold('Move Flat barbell bench press', 90);
  } },
  { id: 'L63', file: 'L63-Logging-Reorder-Failed', title: "Logging › Reorder exercises · couldn't save the order", row: 'L1 Log sets', today: friday, full: false, answers: { [`PUT /api/v1/workouts/${sampleWorkout.id}/exercise-order`]: 'fail' }, steps: async (on) => {
    await on.go(reorderPath);
    await on.hold('Move Flat barbell bench press', 90);
    await on.release();
    await on.waitFor("Couldn't save the order. Try again.");
  } },
  { id: 'L50', file: 'L50-Logging-Exercise-Removed', title: 'Logging · exercise removed, with Undo', row: 'L2 Exercises', today: friday, full: false, steps: async (on) => {
    await removeBench(on);
    await on.waitFor('Flat barbell bench press removed.');
  } },
  { id: 'L51', file: 'L51-Logging-Remove-Exercise-Failed', title: "Logging · couldn't remove an exercise", row: 'L2 Exercises', today: friday, full: false, answers: { [`DELETE ${benchPath}`]: 'fail' }, steps: async (on) => {
    await removeBench(on);
    await on.waitFor("Couldn't remove the exercise. Try again.");
  } },
  { id: 'L52', file: 'L52-Logging-Undo-Remove-Failed', title: "Logging · couldn't bring the exercise back", row: 'L2 Exercises', today: friday, full: false, answers: { [`POST /api/v1/workouts/${sampleWorkout.id}/exercises`]: 'fail' }, steps: async (on) => {
    await removeBench(on);
    await on.waitFor('Flat barbell bench press removed.');
    // The confirm sheet is still closing, with its own copy of the notification.
    await on.sleep(1000);
    await on.tap('Undo');
    await on.waitFor("Couldn't bring the exercise back. Try again.");
  } },
  { id: 'L53', file: 'L53-Logging-Exercise-Swapped', title: 'Logging · exercise swapped, with Undo', row: 'L2 Exercises', today: friday, full: false, answers: { [swapPath]: swapped }, steps: async (on) => {
    await swapIncline(on);
    await on.waitFor(`${inclineDumbbellPress.name} swapped for ${lateralRaise.name}.`);
  } },
  { id: 'L54', file: 'L54-Logging-Swap-Swapping', title: 'Logging › Swap exercise · swapping', row: 'L2 Exercises', today: friday, answers: { [swapPath]: 'hold' }, steps: async (on) => {
    await swapIncline(on);
    await on.waitFor('Swapping exercise');
  } },
  { id: 'L55', file: 'L55-Logging-Swap-Failed', title: "Logging › Swap exercise · couldn't swap", row: 'L2 Exercises', today: friday, full: false, answers: { [swapPath]: problem(409, 'workout.exercise_has_checked_sets', "An exercise with checked sets can't be swapped. Uncheck them first.") }, steps: async (on) => {
    await swapIncline(on);
    await on.waitFor("An exercise with checked sets can't be swapped. Uncheck them first.");
  } },
  { id: 'L56', file: 'L56-Logging-Undo-Swap-Failed', title: "Logging · couldn't undo a swap", row: 'L2 Exercises', today: friday, full: false, answers: { [swapPath]: swapOnceThenFail() }, steps: async (on) => {
    await swapIncline(on);
    await on.tap('Undo');
    await on.waitFor("Couldn't undo the swap. Try again.");
  } },
  { id: 'L57', file: 'L57-Logging-Add-Exercise-Adding', title: 'Logging › Add exercise · adding', row: 'L2 Exercises', today: friday, answers: { [`POST /api/v1/workouts/${sampleWorkout.id}/exercises`]: 'hold' }, steps: async (on) => {
    await pickToAdd(on);
    await on.tap('Add exercise');
    await on.waitFor('Adding exercise');
  } },
  { id: 'L58', file: 'L58-Logging-Add-Exercise-Failed', title: "Logging › Add exercise · couldn't add", row: 'L2 Exercises', today: friday, full: false, answers: { [`POST /api/v1/workouts/${sampleWorkout.id}/exercises`]: problem(409, 'workout.too_many_exercises', 'A workout can have at most 30 exercises.') }, steps: async (on) => {
    await pickToAdd(on);
    await on.tap('Add exercise');
    await on.waitFor('A workout can have at most 30 exercises.');
  } },
  { id: 'L59', file: 'L59-Logging-Add-Exercise-Discard', title: 'Logging › Add exercise › Discard picks · confirm', row: 'L2 Exercises', today: friday, full: false, steps: async (on) => {
    await pickToAdd(on);
    await on.tap('Logging');
    await on.waitFor('Discard changes?');
    await on.sleep(400);
  } },
  // R · Routines
  { id: 'R02', file: 'R02-Routines-Loading', title: 'Routines · loading', row: 'R1 Routines tab', answers: { 'GET /api/v1/routines': 'hold', 'GET /api/v1/week-plan-days': 'hold' }, steps: (on) => on.go('/routines') },
  { id: 'R01', file: 'R01-Routines', title: 'Routines', row: 'R1 Routines tab', steps: async (on) => {
    await on.go('/routines');
    await on.waitFor('Legs');
  } },
  { id: 'R03', file: 'R03-Routines-Empty', title: 'Routines · no routines yet', row: 'R1 Routines tab', answers: { 'GET /api/v1/routines': { status: 200, body: [] } }, steps: (on) => on.go('/routines') },
  { id: 'R04', file: 'R04-Routines-No-Matches', title: 'Routines · no search matches', row: 'R1 Routines tab', steps: async (on) => {
    await on.go('/routines');
    await on.waitFor('Legs');
    await on.type('Search routines', 'Push');
  } },
  { id: 'R06', file: 'R06-Routines-Load-Failure', title: 'Routines · load failure', row: 'R1 Routines tab', answers: { 'GET /api/v1/routines': 'fail', 'GET /api/v1/week-plan-days': 'fail' }, steps: async (on) => {
    await on.go('/routines');
    await on.waitFor('Try again');
  } },
  { id: 'R07', file: 'R07-Routines-Deleted-Undo', title: 'Routines · routine deleted, with Undo', row: 'R1 Routines tab', full: false, steps: async (on) => {
    await on.tap('Routines');
    await on.tap('Chest and arms 1, 7 exercises · 19 sets');
    await on.tap('Delete routine');
    await on.tap('Delete routine');
    await on.waitFor('Undo');
  } },
  { id: 'R11', file: 'R11-Routines-Rest-Day', title: 'Routines · rest day says how to plan it', row: 'R1 Routines tab', full: false, steps: async (on) => {
    await on.go('/routines');
    await on.tap('Thursday, rest day');
    await on.waitFor('Thursday is a rest day. Edit a routine to pick its days.');
  } },
  { id: 'R05', file: 'R05-Routines-Details', title: 'Routines › Routine details', row: 'R3 Edit a routine', steps: async (on) => {
    await on.go(routinePath);
    await on.waitFor('Flat barbell bench press');
  } },
  { id: 'R08', file: 'R08-Routines-Details-Loading', title: 'Routines › Routine details · loading', row: 'R3 Edit a routine', answers: { [`GET /api/v1/routines/${chestAndArms.id}`]: 'hold' }, steps: (on) => on.go(routinePath) },
  { id: 'R09', file: 'R09-Routines-Details-Load-Failure', title: 'Routines › Routine details · load failure', row: 'R3 Edit a routine', answers: { [`GET /api/v1/routines/${chestAndArms.id}`]: 'fail' }, steps: async (on) => {
    await on.go(routinePath);
    await on.waitFor('Try again');
  } },
  { id: 'R20', file: 'R20-Routines-Edit', title: 'Routines › Edit routine', row: 'R3 Edit a routine', steps: async (on) => {
    await on.go(editPath);
    await on.waitFor('Save routine');
  } },
  { id: 'R24', file: 'R24-Routines-Edit-Name-Taken', title: 'Routines › Edit routine · name taken', row: 'R3 Edit a routine', answers: { [`PUT /api/v1/routines/${chestAndArms.id}`]: problem(409, 'routine.name_taken', 'You already have a routine with this name.') }, steps: async (on) => {
    await on.go(editPath);
    await on.type('Name', 'Legs');
    await on.tap('Save routine');
  } },
  { id: 'R25', file: 'R25-Routines-Edit-Exercise-Removed', title: 'Routines › Edit routine · exercise removed, with Undo', row: 'R3 Edit a routine', full: false, steps: async (on) => {
    await on.go(editPath);
    await on.tap('Remove Cable crossover');
    await on.tap('Remove exercise');
    await on.waitFor('Undo');
  } },
  { id: 'R26', file: 'R26-Routines-Edit-Discard', title: 'Routines › Edit routine › Discard changes · confirm', row: 'R3 Edit a routine', full: false, steps: async (on) => {
    await on.go(routinePath);
    await on.tap('Edit routine');
    await on.waitFor('Save routine');
    await on.type('Name', 'Upper body');
    await on.tap(chestAndArms.name);
    await on.waitFor('Discard changes?');
  } },
  { id: 'R28', file: 'R28-Routines-Edit-Day-Moved', title: 'Routines › Routine details · a day moved from another routine', row: 'R3 Edit a routine', steps: async (on) => {
    await on.tap('Routines');
    await on.tap('Chest and arms 1, 7 exercises · 19 sets');
    await on.tap('Edit routine');
    await on.waitFor('Save routine');
    await on.tap('Tuesday');
    await on.tap('Save routine');
    await on.waitFor('Chest and arms 1 saved. Tuesday moved from Back and shoulders 1.');
  } },
  { id: 'R27', file: 'R27-Routines-Details-Same-Group', title: 'Routines › Routine details · same group joined', row: 'R3 Edit a routine', answers: { [`GET /api/v1/routines/${chestAndArms.id}`]: { status: 200, body: chestAndArmsTogether } }, steps: async (on) => {
    await on.go(routinePath);
    await on.waitFor('Flat barbell bench press');
  } },
  { id: 'R29', file: 'R29-Routines-Edit-Same-Group', title: 'Routines › Edit routine · same group joined', row: 'R3 Edit a routine', answers: { [`GET /api/v1/routines/${chestAndArms.id}`]: { status: 200, body: chestAndArmsTogether } }, steps: async (on) => {
    await on.go(editPath);
    await on.waitFor('Save routine');
  } },
  { id: 'R21', file: 'R21-Routines-Edit-Targets', title: 'Routines › Edit routine › Sets and reps', row: 'R3 Edit a routine', steps: async (on) => {
    await on.go(editPath);
    await on.tap('Flat barbell bench press, 3 × 8–10');
    await on.waitFor('Save targets');
  } },
  { id: 'R23', file: 'R23-Routines-Remove-Exercise-Confirm', title: 'Routines › Edit routine › Remove exercise · confirm', row: 'R3 Edit a routine', full: false, steps: async (on) => {
    await on.go(editPath);
    await on.tap('Remove Flat barbell bench press');
    await on.waitFor('Remove exercise');
  } },
  { id: 'R22', file: 'R22-Routines-Delete-Confirm', title: 'Routines › Delete routine · confirm', row: 'R3 Edit a routine', full: false, steps: async (on) => {
    await on.go(routinePath);
    await on.tap('Delete routine');
    await on.waitFor('Delete Chest and arms 1?');
  } },
  { id: 'R30', file: 'R30-Routines-New', title: 'Routines › New routine', row: 'R4 New routine', steps: (on) => on.go('/routine/new') },
  { id: 'R32', file: 'R32-Routines-New-Days-Picked', title: 'Routines › New routine · days picked', row: 'R4 New routine', steps: async (on) => {
    await on.go('/routine/new');
    await on.tap('Monday');
    await on.tap('Thursday');
  } },
  { id: 'R31', file: 'R31-Routines-New-Errors', title: 'Routines › New routine · fields missing', row: 'R4 New routine', steps: async (on) => {
    await on.go('/routine/new');
    await on.tap('Save routine');
  } },
  { id: 'R12', file: 'R12-Routines-Undo-Failed', title: "Routines · couldn't undo a delete", row: 'R1 Routines tab', full: false, answers: { [`POST /api/v1/routines/${chestAndArms.id}/restore`]: 'fail' }, steps: async (on) => {
    await deleteRoutine(on);
    await on.tap('Undo');
    await on.waitFor("Couldn't undo. Try again.");
  } },
  { id: 'R33', file: 'R33-Routines-Details-No-Days', title: 'Routines › Routine details · not on any day', row: 'R3 Edit a routine', answers: { [`GET /api/v1/routines/${chestAndArms.id}`]: { status: 200, body: { ...chestAndArms, weekdays: [] } } }, steps: async (on) => {
    await on.go(routinePath);
    await on.waitFor('Not on any day yet');
  } },
  { id: 'R34', file: 'R34-Routines-Edit-Dragging', title: 'Routines › Edit routine · dragging an exercise', row: 'R3 Edit a routine', full: false, steps: async (on) => {
    await on.go(editPath);
    await on.waitFor('Save routine');
    await on.sleep(500);
    await on.hold('Move Flat barbell bench press', 90);
  } },
  { id: 'R35', file: 'R35-Routines-Edit-Loading', title: 'Routines › Edit routine · loading', row: 'R3 Edit a routine', answers: { [`GET /api/v1/routines/${chestAndArms.id}`]: 'hold' }, steps: async (on) => {
    await on.go(editPath);
    await on.sleep(400);
  } },
  { id: 'R36', file: 'R36-Routines-Edit-Load-Failure', title: 'Routines › Edit routine · load failure', row: 'R3 Edit a routine', answers: { [`GET /api/v1/routines/${chestAndArms.id}`]: 'fail' }, steps: async (on) => {
    await on.go(editPath);
    await on.waitFor('Try again');
  } },
  { id: 'R37', file: 'R37-Routines-Edit-Saving', title: 'Routines › Edit routine · saving', row: 'R3 Edit a routine', answers: { [`PUT /api/v1/routines/${chestAndArms.id}`]: 'hold' }, steps: editRoutine },
  { id: 'R38', file: 'R38-Routines-Edit-Failed', title: "Routines › Edit routine · couldn't save", row: 'R3 Edit a routine', full: false, answers: { [`PUT /api/v1/routines/${chestAndArms.id}`]: 'fail' }, steps: async (on) => {
    await editRoutine(on);
    await on.waitFor("Couldn't save the routine. Try again.");
  } },
  { id: 'R39', file: 'R39-Routines-Delete-Deleting', title: 'Routines › Delete routine · deleting', row: 'R3 Edit a routine', full: false, answers: { [`DELETE /api/v1/routines/${chestAndArms.id}`]: 'hold' }, steps: deleteRoutine },
  { id: 'R40', file: 'R40-Routines-Delete-Failed', title: "Routines › Delete routine · couldn't delete", row: 'R3 Edit a routine', full: false, answers: { [`DELETE /api/v1/routines/${chestAndArms.id}`]: 'fail' }, steps: async (on) => {
    await deleteRoutine(on);
    await on.waitFor("Couldn't delete the routine. Try again.");
  } },
  { id: 'R41', file: 'R41-Routines-Created', title: 'Routines › Routine details · created', row: 'R4 New routine', full: false, steps: async (on) => {
    await on.tap('Routines');
    await on.tap('New routine');
    await on.waitFor('Save routine');
    await on.type('Name', 'Upper body');
    await on.tap('Add exercise');
    await on.waitFor(benchPress.name);
    await on.tap(benchPress.name);
    await on.tap('Add exercise');
    await on.waitFor('Save routine');
    await on.sleep(600);
    await on.tap('Save routine');
    await on.waitFor('Upper body created.');
  } },
  { id: 'R42', file: 'R42-Routines-Edit-Add-Exercise', title: 'Routines › Edit routine › Add exercise', row: 'R3 Edit a routine', steps: async (on) => {
    await on.go(editPath);
    await on.tap('Add exercise');
    await on.waitFor('Pick the exercises to add to this routine.');
    await on.tap(lateralRaise.name);
  } },
  { id: 'R43', file: 'R43-Routines-New-Limit-Reached', title: 'Routines › New routine · limit reached', row: 'R4 New routine', full: false, answers: { 'POST /api/v1/routines': problem(409, 'routine.limit_reached', "You've reached the limit of 50 routines.") }, steps: async (on) => {
    await createRoutine(on);
    await on.waitFor("You've reached the limit of 50 routines.");
  } },
  { id: 'R44', file: 'R44-Routines-Targets-Discard', title: 'Routines › Edit routine › Sets and reps › Discard changes · confirm', row: 'R3 Edit a routine', full: false, steps: async (on) => {
    await openTargets(on);
    await on.tap('One set more');
    await on.tap('Edit routine');
    await on.waitFor('Discard changes?');
    await on.sleep(400);
  } },
  { id: 'R45', file: 'R45-Routines-Targets-Limit', title: 'Routines › Edit routine › Sets and reps · at the limit', row: 'R3 Edit a routine', full: false, steps: async (on) => {
    await openTargets(on);
    await on.tap('One set less');
    await on.tap('One set less');
    await on.tap('One set less, not available at the limit');
    await on.waitFor('At least 1 set.');
  } },
];
