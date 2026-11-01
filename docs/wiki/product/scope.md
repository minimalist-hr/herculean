---
title: Scope and features
---

## Scope

v1 is the full design in `docs/design/`: every screen, state, interaction rule and content rule.

## Features

Features are built in this order. Each one ships on its own, app and API together, and depends only on the features before it.

Each feature lists what it does, its screens, flows, entities, endpoints, what it leaves to other features, and its own done criteria. Rules are in [Domain and entities](/product/domain#rules). Shared done criteria are in [Conventions](/development/conventions#definition-of-done). Endpoints follow the [API conventions](/development/conventions#api) and are refined while building.

| # | Feature | Screens |
|---|---|---|
| 1 | [Account](#1-account) | A00, A01, A03, A10–A14, A20, A30, H20, H21 |
| 2 | [Exercises](#2-exercises) | E01–E04, E10, E11, E20, E21, E30–E34, L22 |
| 3 | [Routines](#3-routines) | R01–R03, R10, R20–R23, R30, L20, L21, L23, L24 |
| 4 | [Today and other days](#4-today-and-other-days) | H01, H03–H07, W01, W03–W07, W20–W25 |
| 5 | [Logging](#5-logging) | W10, W11, L01–L04, L10–L15, L30, L31, W02, H02 |
| 6 | [Edit workout and month](#6-edit-workout-and-month) | W30–W32, W40–W42 |
| 7 | [Settings](#7-settings) | H10–H19 |

---

## 1. Account

**What it does:** you open the app and stay signed in. You can sign in with email and password, reset a forgotten password by email, create an account and set up your name, units and default rest time, and read the terms of service and privacy policy.

**Screens:** A00 Splash, A02 Couldn't connect, A01 Sign in, A03 Signing in, A10 Reset password, A11 Link sent, A12 New password, A13 Reset email, A14 Opening the app, A20 Create account, A30 Setup, H20 Terms of service, H21 Privacy policy.

**Flows**
- **Launch:** A00 checks for a stored refresh token. With one, H07 opens, or A30 if setup isn't finished. Without one, or when it is refused, A01 opens. With no connection, A02 offers to try again.
- **Sign in:** A01 → A03 → H07, or A30 if setup isn't finished.
- **Reset password:** A01 → A10 → A11 → A13, the email → A14, the page its link opens → A12 → A01. An expired or used link opens A10 with an error line.
- **Create account:** A01 → A20 → A30 → H05. A20 links to H20 and H21, whose back link reads "Create account".

**Entities:** User, Refresh token, Password reset token. Creating an account also gives Training its settings and the 6 groups, through the "Account created" event.

**Endpoints**

| Method | Route | Used by |
|---|---|---|
| POST | `/api/v1/sessions` | A01 sign in |
| POST | `/api/v1/sessions/refresh` | Any screen, when the access token expires |
| POST | `/api/v1/password-resets` | A10, A11 (send link, send link again) |
| POST | `/api/v1/password-resets/complete` | A12 |
| GET | `/links/reset-password` | Redirect page from the email |
| POST | `/api/v1/users` | A20, with the phone's time zone |
| PATCH | `/api/v1/users/me` | A30 (name, units). Also sends a new time zone when the phone's changes. |
| PATCH | `/api/v1/workout-settings` | A30 (default rest time) |

**Left to other features:** Sign out, Delete account and every other setting are in [7. Settings](#7-settings).

**Done when**
- A signed-in user who closes and reopens the app lands on H07 without signing in.
- The reset link opens A12 from the email, in Expo Go.

---

## 2. Exercises

**What it does:** your exercise library, grouped by muscle group. You can search, filter by group, and see each exercise's best set, how often you did it, a heaviest-set chart, the routines that use it and every session. You can create, edit and delete exercises, and create, rename, reorder and delete groups.

**Screens:** E01 Exercises, E02 Loading, E03 No matches, E04 No exercises, E10 Exercise, E11 Never done, E20 Edit exercise, E21 Delete exercise, E30 Groups, E31 Loading, E32 New group, E33 Rename group, E34 Delete group, L22 Create exercise.

**Flows**
- **Browse:** E02 → E01. A search with no results shows E03. No exercises at all shows E04.
- **Create:** Create exercise on E01, E03 or E04 → L22 → Save exercise → E01, with the new exercise in its group.
- **Details:** an E01 row → E10, or E11 if never done. The chart switches between 3M, 6M, 1Y and All. Until [#54](https://gitlab.com/minimalist-sds/herculean/-/issues/54), every row → E11.
- **Edit and delete:** the edit icon on E10 → E20 → Save exercise → E10. Delete exercise → E21 → E01.
- **Groups:** the groups icon on E01 → E31 → E30. New group → E32. A group → E33 (rename). The trash on an empty group → E34 → E30, with an undo bar. Dragging a group sets the chip order.

**Entities:** Exercise, Exercise also works, Group. Reads workouts and sets for best set, times done and history.

**Endpoints**

| Method | Route | Used by |
|---|---|---|
| GET | `/api/v1/exercises` | E01, with `search` and `groupId` filters |
| POST | `/api/v1/exercises` | L22 |
| GET | `/api/v1/exercises/{id}` | E10, E11, E20 |
| PUT | `/api/v1/exercises/{id}` | E20 |
| DELETE | `/api/v1/exercises/{id}` | E21 |
| GET | `/api/v1/exercises/{id}/sessions` | E10 (all sessions, chart), with a `from` filter |
| GET | `/api/v1/groups` | E30, chips everywhere |
| POST | `/api/v1/groups` | E32 |
| PATCH | `/api/v1/groups/{id}` | E33 |
| DELETE | `/api/v1/groups/{id}` | E34 |
| POST | `/api/v1/groups/{id}/restore` | Undo on E30 |
| PUT | `/api/v1/group-order` | E30, drag to reorder |

**Left to other features:** "Used in" on E10 shows routines from [3. Routines](#3-routines). E10's tiles, chart, sessions and `/sessions` endpoint need [5. Logging](#5-logging), so they moved to [#54](https://gitlab.com/minimalist-sds/herculean/-/issues/54).

**Done when**
- A group's trash is only active when no exercise uses it.
- Deleting an exercise removes it from routines, and past workouts still show it.

---

## 3. Routines

**What it does:** you plan your week. You create routines with exercises and targets, and put a routine or a rest day on each weekday. You can edit, reorder and delete routines.

**Screens:** R01 Routines, R02 Loading, R03 No routines, R10 Week plan day, R20 Edit routine, R21 Sets and reps, R22 Delete routine, R23 Remove exercise, R30 New routine, L20 Add exercise, L21 No matches, L23 New one selected, L24 Loading.

**Flows**
- **Routines tab:** R02 → R01, or R03 when there are no routines.
- **Week plan:** a weekday on R01 → R10 → Save day → R01.
- **Edit routine:** a routine on R01 → R20. Tap targets → R21 → Save targets. The trash → R23 → R20, with an undo bar. Drag handles reorder. Save routine → R01.
- **Add exercise:** on R20 or R30 → L24 → L20, or L21 when nothing matches → L22 → L23 → back with the picked exercises at 3 × 8–10.
- **Delete routine:** Delete routine on R20 → R22 → R01.
- **New routine:** New routine on R01 or R03 → R30 → Save routine → R01.

Changes on R20 and R30 stay in the app until Save routine.

**Entities:** Routine, Routine exercise, Week plan day.

**Endpoints**

| Method | Route | Used by |
|---|---|---|
| GET | `/api/v1/routines` | R01 (with day tags), W10 (with last done date) |
| POST | `/api/v1/routines` | R30 |
| GET | `/api/v1/routines/{id}` | R20 |
| PUT | `/api/v1/routines/{id}` | R20 Save routine: name, exercises, order and targets |
| DELETE | `/api/v1/routines/{id}` | R22 |
| GET | `/api/v1/week-plan-days` | R01 |
| PUT | `/api/v1/week-plan-days/{weekday}` | R10 |

**Left to other features:** Create routine on H05 and W05 opens R30. Those screens are built in [4. Today and other days](#4-today-and-other-days).

**Done when**
- Changing a weekday in R10 changes today and later only. Past days keep the plan they had.
- Deleting a routine turns its weekdays into rest days from today on. Past days keep their plan.

---

## 4. Today and other days

**What it does:** Home and Workout show today at a glance. A week strip shows the status of each day. You can open any day of the week to see it as done, missed, skipped, rest or upcoming, and you can skip a workout and undo the skip.

**Screens:** H01 Home, H03 Completed, H04 Rest day, H05 No routines, H06 Skipped, H07 Loading, W01 Today, W03 Completed, W04 Rest day, W05 No routines, W06 Skipped, W07 Loading, W20 Past day, W21 Missed day, W22 Skipped day, W23 Yesterday rest day, W24 Tomorrow, W25 Rest day.

**Flows**
- **Home:** H07 → H01, H03, H04, H05 or H06, depending on today. The greeting follows the time of day.
- **Workout tab:** W07 → W01, W03, W04, W05 or W06.
- **Other days:** a day in the week strip → W20 to W25, with "Back to today".
- **Skip:** Skip workout on W01 or W21 → W06 or W22. Undo skip → W01 or W21.
- **No routines:** Create routine on H05 or W05 → R30.

**Entities:** Workout (skipped). Reads the week plan and routines.

**Endpoints**

| Method | Route | Used by |
|---|---|---|
| GET | `/api/v1/days/{date}` | H01–H07, W01–W07, W20–W25: status, routine or workout, and up next |
| GET | `/api/v1/days` | Week strip, with `from` and `to` filters |
| POST | `/api/v1/workouts` | Skip workout: a workout with status skipped |
| DELETE | `/api/v1/workouts/{id}` | Undo skip |

**Left to other features:** Start workout, Load routine, Other routine and Log workout open logging, in [5. Logging](#5-logging). Edit, Delete and the calendar icon are in [6. Edit workout and month](#6-edit-workout-and-month). The FM avatar opens [7. Settings](#7-settings).

**Done when**
- Each day shows the status from the [day table](/product/domain#how-a-day-is-shown), in the user's time zone.

---

## 5. Logging

**What it does:** you start a workout from today's routine, another routine or a missed day, and log it at the gym. You check off sets with weight and reps, get a rest timer after each checked set, add and remove sets and exercises, reorder exercises and look at an exercise's history. You finish with a summary and new records, then save or discard. A workout in progress survives closing the app and can be resumed from any tab.

**Screens:** W10 Choose a routine, W11 Loading, L01 Logging, L02 No exercises left, L03 Loading, L04 Reorder, L10 Edit weight, L11 Edit reps, L12 Set removed, L13 Remove exercise, L14 Exercise history, L15 History empty, L30 Finish workout, L31 Nothing logged, W02 Workout in progress, H02 Home in progress. Plus the Resume bar.

**Flows**
- **Start:** Start workout (H01), Load routine (W01), Log workout (W21 or W22), or a routine picked on W10 (from Other routine on W01 or H04) → L03 → L01.
- **Sets:** tap a weight or reps → L10 or L11 → Save set. Check a set → rest timer with −15, +15 and Skip. Add set adds a row. Remove set (in L10 or L11) → L12 undo bar.
- **Exercises:** the trash → L13 → undo bar. Add exercise → the L20 flow from [3. Routines](#3-routines) → L01. Reorder → L04 → Save order. Removing every exercise shows L02.
- **History:** the clock icon or the exercise name → L14, or L15 if never done. Full history → E10.
- **Finish:** Finish → L30, or L31 if nothing is checked. Save workout → H03. Keep logging → L01. Discard workout → W01, with an undo bar.
- **Resume:** Resume on H02 or W02, or the Resume bar on any tab → L01.

**Entities:** Workout, Workout exercise, Set. Reads Workout settings for the rest timer.

**Endpoints**

| Method | Route | Used by |
|---|---|---|
| POST | `/api/v1/workouts` | Start: date and routine |
| GET | `/api/v1/workouts` | Resume bar, H02, W02, with a `status` filter |
| GET | `/api/v1/workouts/{id}` | L01, with last time per exercise |
| POST | `/api/v1/workouts/{id}/exercises` | L20 Add exercise, undo on L13 |
| DELETE | `/api/v1/workouts/{id}/exercises/{workoutExerciseId}` | L13 |
| PUT | `/api/v1/workouts/{id}/exercise-order` | L04 |
| POST | `/api/v1/workouts/{id}/exercises/{workoutExerciseId}/sets` | Add set, undo on L12 |
| PATCH | `/api/v1/workouts/{id}/exercises/{workoutExerciseId}/sets/{setId}` | L10, L11, check a set |
| DELETE | `/api/v1/workouts/{id}/exercises/{workoutExerciseId}/sets/{setId}` | Remove set |
| GET | `/api/v1/workouts/{id}/summary` | L30, L31: duration, sets, volume, records |
| PATCH | `/api/v1/workouts/{id}` | Save workout: status completed |
| DELETE | `/api/v1/workouts/{id}` | Discard workout |
| POST | `/api/v1/workouts/{id}/restore` | Undo discard on W01 |
| GET | `/api/v1/workout-settings` | Rest timer |

**Done when**
- Closing the app mid-workout and opening it again resumes the workout as it was.
- The rest timer alerts when it ends, even with the screen locked.

---

## 6. Edit workout and month

**What it does:** you correct a logged workout or delete it. You see a month at a time, with done, missed and skipped counts, a calendar with a status under each past day, and month totals.

**Screens:** W30 Edit workout, W31 Set removed, W32 Delete workout, W40 Month, W41 Loading, W42 Day summary.

**Flows**
- **Edit:** Edit on W03 or W20 → W30. Sets use the L10 and L11 sheets. Remove set → W31 undo bar. The trash on an exercise → L13 → undo bar. Add exercise → the L20 flow. Save workout → back to the day.
- **Delete:** Delete on W03 or W20 → W32 → the day, with an undo bar.
- **Month:** the calendar icon on W01 → W41 → W40. Previous and next month. A day → W42 → Open day → W20 to W25, with "Back to month".

Changes on W30 stay in the app until Save workout.

**Entities:** Workout, Workout exercise, Set.

**Endpoints**

| Method | Route | Used by |
|---|---|---|
| PUT | `/api/v1/workouts/{id}` | W30 Save workout: exercises and sets |
| DELETE | `/api/v1/workouts/{id}` | W32 |
| POST | `/api/v1/workouts/{id}/restore` | Undo after W32 |
| GET | `/api/v1/days` | W40 calendar, W42, with `from` and `to` filters |
| GET | `/api/v1/month-summaries/{yyyy-MM}` | W40 tiles and totals |

**Done when**
- Editing a past workout updates best sets and history everywhere.
- Month totals follow the [month total rules](/product/domain#month-totals-w40).

---

## 7. Settings

**What it does:** you manage your profile photo, theme, color, units, default rest time, sound and vibrate when rest ends, name, email and password. You can sign out or delete your account.

**Screens:** H10 Settings, H11 Profile photo, H12 Theme, H13 Color, H14 Units, H15 Default rest time, H16 Name, H17 Email, H18 Change password, H19 Delete account.

**Flows**
- **Open:** the FM avatar on Home → H10.
- **Change a setting:** a row on H10 → its sheet (H11 to H18) → Save → H10.
- **Photo:** H11 → Take photo or Choose from library. Remove photo → H10, with an undo bar.
- **Email:** H17 → Save email → link in the email → the new email is active.
- **Sign out:** → A01.
- **Delete account:** → H19 → A01.

**Entities:** User, Email change token, Refresh token, Workout settings.

**Endpoints**

| Method | Route | Used by |
|---|---|---|
| GET | `/api/v1/users/me` | H10 |
| PATCH | `/api/v1/users/me` | H12, H13, H14, H16 |
| PUT | `/api/v1/users/me/photo` | H11, undo on H10 |
| DELETE | `/api/v1/users/me/photo` | H11 Remove photo |
| PUT | `/api/v1/users/me/password` | H18 |
| POST | `/api/v1/email-changes` | H17 |
| POST | `/api/v1/email-changes/confirm` | Opened from the email link |
| GET | `/links/confirm-email` | Redirect page from the email |
| GET | `/api/v1/workout-settings` | H10 |
| PATCH | `/api/v1/workout-settings` | H15, sound and vibrate toggles |
| DELETE | `/api/v1/sessions/current` | Sign out |
| DELETE | `/api/v1/users/me` | H19 |

**Done when**
- A theme or color change applies to the whole app right away.
- The email only changes after the link is opened.
