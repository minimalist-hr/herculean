// Every built screen and state. A new one goes in the screen index after the one before it here.

import { problem, sample } from './fixtures.mjs';

const { benchPress, lateralRaise, chest, chestAndArms, chestAndArmsTogether, exerciseDetails } = sample;

const exercisePath = `/exercises/${lateralRaise.id}`;
const routinePath = `/routines/${chestAndArms.id}`;
const editPath = `/routine/${chestAndArms.id}/edit`;
const groupPath = `/exercises/groups/${chest.id}`;
const lists = (answer) => ({ 'GET /api/v1/exercises': answer });
const noGroups = { status: 200, body: [] };

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

  // L · Add exercise, reached from a routine
  { id: 'L20', file: 'L20-Logging-Add-Exercise', title: 'Logging › Add exercise', row: 'L2 Exercises', steps: async (on) => {
    await on.go('/routine/new/add-exercise');
    await on.waitFor(benchPress.name);
    await on.tap(benchPress.name);
  } },
  { id: 'L24', file: 'L24-Logging-Add-Exercise-Loading', title: 'Logging › Add exercise · loading', row: 'L2 Exercises', full: false, answers: { ...lists('hold'), 'GET /api/v1/groups': 'hold' }, steps: (on) => on.go('/routine/new/add-exercise') },
  { id: 'L25', file: 'L25-Logging-Add-Exercise-Load-Failure', title: 'Logging › Add exercise · load failure', row: 'L2 Exercises', answers: lists('fail'), steps: async (on) => {
    await on.go('/routine/new/add-exercise');
    await on.waitFor('Try again');
  } },
  { id: 'L21', file: 'L21-Logging-Add-Exercise-No-Matches', title: 'Logging › Add exercise · no matches', row: 'L2 Exercises', steps: async (on) => {
    await on.go('/routine/new/add-exercise');
    await on.waitFor(benchPress.name);
    await on.type('Search exercises', 'Pistol squat');
    await on.sleep(600);
  } },
  { id: 'L23', file: 'L23-Logging-Add-Exercise-New-Selected', title: 'Logging › Add exercise · new one selected', row: 'L2 Exercises', steps: async (on) => {
    await on.go('/routine/new/add-exercise');
    await on.waitFor(benchPress.name);
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
  { id: 'L22', file: 'L22-Logging-New-Exercise', title: 'Logging › New exercise', row: 'L2 Exercises', steps: (on) => on.go('/routine/new/new-exercise') },
  { id: 'L26', file: 'L26-Logging-New-Exercise-Errors', title: 'Logging › New exercise · fields missing', row: 'L2 Exercises', steps: async (on) => {
    await on.go('/routine/new/new-exercise');
    await on.tap('Save exercise');
  } },
  { id: 'L27', file: 'L27-Logging-Add-Exercise-No-Groups', title: 'Logging › Add exercise · no groups, New exercise says why', row: 'L2 Exercises', answers: { 'GET /api/v1/groups': noGroups, ...lists({ status: 200, body: [] }) }, steps: async (on) => {
    await on.go('/routine/new/add-exercise');
    await on.tap('New exercise');
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
];
