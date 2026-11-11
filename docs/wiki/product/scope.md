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
| 2 | [Exercises](#2-exercises) | E01–E04, E10, E11, E20, E21, E30–E36, L22 |
| 3 | [Routines](#3-routines) | R01–R03, R05, R20–R23, R30, L20, L21, L23, L24 |
| 4 | [Today and other days](#4-today-and-other-days) | W01, W03–W07, W20–W25 |
| 5 | [Logging](#5-logging) | W10, W11, W57–W71, L01–L04, L10–L13, L30, L31, W02, W42 |
| 6 | [Edit workout and month](#6-edit-workout-and-month) | W30–W32, W40, W41, W43–W49 |
| 7 | [Settings](#7-settings) | H10–H19 |
| 8 | [Home](#8-home) | H01–H09, H44 |
| 9 | [Feedback](#9-feedback) | F01–F27, H91, H92 |

Each feature lists its main screens. Every state is in `docs/design/screen-index.md`.

---

## 1. Account

**What it does:** you open the app and stay signed in. You can sign in with email and password, reset a forgotten password by email, create an account and set up your name, units and default rest time, and read the terms of service and privacy policy.

**Screens:** A00 Splash, A02 Couldn't connect, A01 Sign in, A03 Signing in, A10 Reset password, A11 Link sent, A12 New password, A13 Reset email, A14 Opening the app, A20 Create account, A30 Setup, H20 Terms of service, H21 Privacy policy.

**Flows**
- **Launch:** A00 checks for a stored refresh token. With one, H07 opens, or A30 if setup isn't finished. Without one, or when it is refused, A01 opens. With no connection, A02 offers to try again.
- **Sign in:** A01 → A03 → H07, or A30 if setup isn't finished.
- **Reset password:** A01 → A10 → A11 → A13, the email → A14, the page its link opens → A12 → A01. An expired or used link opens A10 with an error line.
- **Create account:** A01 → A20 → A30 → H05. A20 links to H20 and H21, whose back link reads "Create account".

**Entities:** User, Refresh token, Password reset token. Creating an account also gives Training its settings, the 6 groups and the starter exercises, through the "Account created" event.

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

**Screens:** E01 Exercises, E02 Loading, E03 No matches, E04 No exercises, E10 Exercise, E11 Never done, E20 Edit exercise, E21 Delete exercise, E30 Groups, E31 Loading, E36 No groups, E32 New group, E33 Edit group, E34 Delete group, E35 Group, L22 New exercise.

**Flows**
- **Browse:** E02 → E01. A search with no results shows E03. No exercises at all shows E04.
- **Create:** New exercise on E01, E03 or E04 → L22 → Save exercise → E01, with the new exercise in its group.
- **Details:** an E01 row → E10, or E11 if never done. The chart switches between 3M, 6M, 1Y and All.
- **Edit and delete:** the edit icon on E10 → E20 → Save exercise → E10. The trash icon on E10 → E21 → E01. Each says so in a notification.
- **Groups:** the Groups chip on E01 → E31 → E30, or E36 with no groups. New group → E32. A group → E35, which lists its exercises with their best sets, and says "No sessions yet" until one of them is done. The edit icon on E35 → E33. The trash on an empty group → E34 → E30, with a notification that has Undo. On a group in use, the trash says why it can't be deleted. Dragging a group sets the chip order.

**Entities:** Exercise, Exercise also works, Group. Reads workouts and sets for best set, times done and history.

**Endpoints**

| Method | Route | Used by |
|---|---|---|
| GET | `/api/v1/exercises` | E01, with `search` and `groupId` filters |
| POST | `/api/v1/exercises` | L22 |
| GET | `/api/v1/exercises/{id}` | E10, E11, E20 |
| PUT | `/api/v1/exercises/{id}` | E20 |
| DELETE | `/api/v1/exercises/{id}` | E21 |
| POST | `/api/v1/exercises/{id}/restore` | Undo on E01 |
| GET | `/api/v1/exercises/{id}/sessions` | E10's sessions, 20 a page, newest first, with `cursor` for the next page and each month's count |
| GET | `/api/v1/exercises/{id}/progress` | E10's chart: each session's heaviest set over `range` (3m, 6m, 1y or all), oldest first, or each month's past 60 sessions |
| GET | `/api/v1/groups` | E30, chips everywhere |
| GET | `/api/v1/groups/{id}` | E35 |
| POST | `/api/v1/groups` | E32 |
| PATCH | `/api/v1/groups/{id}` | E33 |
| DELETE | `/api/v1/groups/{id}` | E34 |
| POST | `/api/v1/groups/{id}/restore` | Undo on E30 |
| PUT | `/api/v1/group-order` | E30, drag to reorder |

**Left to other features:** "Used in" on E10 shows routines from [3. Routines](#3-routines).

**Done when**
- A group's trash is only active when no exercise uses it.
- An exercise's trash is only active when no routine has it, and past workouts still show a deleted exercise.

---

## 3. Routines

**What it does:** you plan your week. You create routines with exercises and targets, and put a routine or a rest day on each weekday. You can edit, reorder and delete routines.

**Screens:** R01 Routines, R02 Loading, R03 No routines, R05 Routine details, R20 Edit routine, R21 Sets and reps, R22 Delete routine, R23 Remove exercise, R30 New routine, L20 Add exercise, L21 No matches, L23 New one selected, L24 Loading.

**Flows**
- **Routines tab:** R02 → R01, or R03 when there are no routines.
- **Week plan:** a day with a routine on R01 → R05. A rest day says how to plan it. On R03, a rest day → R30 with that day picked.
- **Routine details:** a routine on R01 → R05.
- **Edit routine:** edit on R05 → R20. Tap targets → R21 → Save targets. The trash → R23 → R20, with a notification that has Undo. Drag handles reorder. Save routine → R05. The back link cancels.
- **Add exercise:** on R20 or R30 → L24 → L20, or L21 when nothing matches → L22 → L23 → back with the picked exercises at 3 × 8–10.
- **Delete routine:** the trash on R05 → R22 → R01, with a notification that has Undo.
- **New routine:** New routine on R01 or R03 → R30 → Save routine → R01.

Changes on R20 and R30 stay in the app until Save routine.

**Entities:** Routine, Routine exercise, Week plan day.

**Endpoints**

| Method | Route | Used by |
|---|---|---|
| GET | `/api/v1/routines` | R01 (with day tags), W10 (with last done date) |
| POST | `/api/v1/routines` | R30: name, days, exercises, order and targets |
| GET | `/api/v1/routines/{id}` | R05, R20 |
| PUT | `/api/v1/routines/{id}` | R20 Save routine: name, days, exercises, order and targets |
| DELETE | `/api/v1/routines/{id}` | R22 |
| POST | `/api/v1/routines/{id}/restore` | Undo on R01 |
| GET | `/api/v1/week-plan-days` | R01 |

**Left to other features:** New routine on H05 and W05 opens R30. Those screens are built in [4. Today and other days](#4-today-and-other-days).

**Done when**
- Changing a routine's days on R20 or R30 changes today and later only. Past days keep the plan they had.
- A day holds one routine, so picking a day another routine has moves it.
- Deleting a routine turns its weekdays into rest days from that date on. Earlier days keep their plan, and Undo brings the weekdays back.

---

## 4. Today and other days

**What it does:** Workout shows today at a glance. A week strip shows the status of each day. You can open any day of the week to see it as done, missed, skipped, rest or upcoming, and you can skip a workout and undo the skip.

**Screens:** W01 Today, W04 Rest day, W05 No routines, W06 Skipped, W26 Skip confirm, W27 Undo skip confirm, W07 Loading, W08 Load failure, W09 Rest tomorrow, W21 Missed day, W22 Skipped day, W23 Yesterday rest day, W24 Tomorrow, W25 Rest day, W28 Another week.

**Flows**
- **Workout tab:** W07 → W01, W04, W05, W06 or W09, or W08 if it fails to load.
- **Other days:** a day in the week strip → W21 to W25, with "Back to today". Swiping the strip → the same weekday in another week, W28.
- **Skip:** Skip workout on W01 or W21 → W26 → W06 or W22. Undo skip → W27 → the day's plan. Every state and action: [What you can do on a day](/product/domain#what-you-can-do-on-a-day).
- **No routines:** New routine on W05 → R30.

**Entities:** Workout (skipped), Workout exercise. Reads the week plan and routines.

**Endpoints**

| Method | Route | Used by |
|---|---|---|
| GET | `/api/v1/days/{date}` | W01–W09, W21–W25: status, routine, and up next, which is always the day after, with its routine's ID and name. The routine and each exercise say whether they still exist, so a deleted one doesn't link. Up next doesn't show on past days |
| GET | `/api/v1/days` | Week strip, with `from` and `to` filters |
| GET | `/api/v1/days/first` | Week strip: how far back it reaches |
| POST | `/api/v1/workouts` | Skip workout: a workout with status skipped |
| DELETE | `/api/v1/workouts/{id}` | Undo skip |

**Left to other features:** Home is in [8. Home](#8-home). W03 and W20 show a completed workout, and come with logging. Start workout, Other routine and Log workout open logging, in [5. Logging](#5-logging). Edit and Delete are in [6. Edit workout and month](#6-edit-workout-and-month). The FM avatar opens [7. Settings](#7-settings).

**Done when**
- Each day shows the status from the [day table](/product/domain#how-a-day-is-shown), in the user's time zone.

---

## 5. Logging

**What it does:** you start a workout from today's routine, another routine or a missed day, and log it at the gym. You check off sets with weight and reps, get a rest timer to start after each checked set, add and remove sets and exercises, reorder exercises and look at an exercise's history. You finish with a summary and new records, then save or discard. A workout in progress survives closing the app and can be resumed from any tab.

**Screens:** W42 Day summary, W10 Choose a routine, W11 Loading, W57 Confirm, W58 Starting, W59 Couldn't start, W60 Nothing in the week plan, W61 and W62 Confirm loading and failure, W63 Load failure, W64 Before the first day, W65 Workout discarded, W66 Couldn't undo, W67 Workout details, W68 and W69 Loading and failure, W70 Saved day failure, W71 From the month, L01 Logging, L06 Rest ready, L07 Rest running, L08 Rest hidden, L09 Rest over, L02 No exercises left, L03 Loading, L05 Load failure, L04 Reorder, L10 Edit weight, L11 Edit reps, L12 Set removed, L13 Remove exercise, L16 Swap says why, L29 Swap exercise, L30 Finish workout, L31 Nothing logged, L32 Past day, L33 Discard, L34 and L35 Loading and failure, L36 to L39 Saving, discarding and failure, W02 Workout in progress, W03 Completed, W20 Past day, E10 Exercise. Plus the Resume bar.

**Flows**
- **Start:** Start workout (W01, H01), Log workout (W21), or a routine picked on W10 (from Other routine on W01, W04, W21 or a past rest day) → W57 → L03 → L01. The back link on L01 then returns to the day, not to W10.
- **Sets:** tap a weight or reps → L10 or L11 → Save set. Check a set → rest bar, ready to start, with −15, +15 and Start, then Skip. It can be hidden and opened again. Add set adds a row with the last set's values. The trash in L10 or L11 → L12 undo bar.
- **Exercises:** the trash → L13 → undo bar. Add exercise → the L20 flow from [3. Routines](#3-routines) → L01. The swap icon → the L20 flow, one pick → L01, with an undo bar. Reorder → L04, which saves each drop. Removing every exercise shows L02.
- **History:** the exercise name → E10.
- **Finish:** Finish → L34 → L30, or L31 if nothing is checked. The back link → L01. Save workout → the day, completed, which says so in a notification. Discard workout → L33 → the day on its plan, with an undo bar (W65). Undo → the day, in progress.
- **Saved day:** W03 and W20 show a saved workout with the sets done, then View workout → W67, Edit → W30, and Delete → W32. On the month, W42 → View workout → W67, or Open day → the Workout tab on that day. The back link on W67 returns to where it opened from, and says Workout, or Month from W42.
- **Resume:** Resume on W02, or the Resume bar on any tab → L01.
- **Leave:** the back link on L01 → W02. Every change saves as you go.

**Entities:** Workout, Workout exercise, Set. Reads Workout settings for the rest timer.

**Endpoints**

| Method | Route | Used by |
|---|---|---|
| POST | `/api/v1/workouts` | Start: date and status. The routine comes with Other routine |
| GET | `/api/v1/workouts` | Resume bar and muted start buttons, with `status=inProgress`, the only status for now |
| GET | `/api/v1/workouts/{id}` | L01, W03, W20, W42, W67, with last time per exercise |
| POST | `/api/v1/workouts/{id}/exercises` | L20 Add exercise, undo on L13 |
| PATCH | `/api/v1/workouts/{id}/exercises/{workoutExerciseId}` | Swap exercise, and its undo |
| DELETE | `/api/v1/workouts/{id}/exercises/{workoutExerciseId}` | L13 |
| PUT | `/api/v1/workouts/{id}/exercise-order` | L04 |
| POST | `/api/v1/workouts/{id}/exercises/{workoutExerciseId}/sets` | Add set, undo on L12 |
| PATCH | `/api/v1/workouts/{id}/exercises/{workoutExerciseId}/sets/{setId}` | L10, L11, check a set |
| DELETE | `/api/v1/workouts/{id}/exercises/{workoutExerciseId}/sets/{setId}` | Remove set |
| GET | `/api/v1/workouts/{id}/summary` | L30, L31, W03, W20, W42, W67: duration, sets, volume, unchecked exercises, records |
| PATCH | `/api/v1/workouts/{id}` | Save workout: status completed |
| DELETE | `/api/v1/workouts/{id}` | Discard workout |
| POST | `/api/v1/workouts/{id}/restore` | Undo discard on W65 |
| GET | `/api/v1/workout-settings` | Rest timer |

**Done when**
- Closing the app mid-workout and opening it again resumes the workout as it was.

---

## 6. Edit workout and month

**What it does:** you correct a logged workout or delete it. You see a month at a time, with done, missed and skipped counts, a calendar with a status under each past day, and month totals.

**Screens:** W30 Edit workout, W31 Set removed, W32 Delete workout, W40 Month, W41 Loading, W43 to W46 Day summary, W47 First month, W48 Another day selected, W49 Load failure.

**Flows**
- **Edit:** Edit on W03 or W20 → W30. Sets use the L10 and L11 sheets. Remove set → W31 undo bar. The trash on an exercise → L13 → undo bar. Add exercise → the L20 flow; an added exercise starts with 3 sets of 0 kg and the low end of the reps, and shows its last time before the workout's date. Save workout → back to the day, which says so in a notification.
- **Delete:** Delete on W03 or W20 → W32 → the day, with an undo bar.
- **Month:** the calendar icon on W01 → W41 → W40. Swipe to change month, from the first day's month to the month holding the last day the week strip reaches. Days past those limits look muted, and tapping one says why (W47). Back to today returns to today, and shows when another day or month is selected. A tapped day stays selected (W48). A day → W43 to W46 → Open day → that day on the Workout tab, in its week, with "Back to month" (W29). W40's back link, named Workout, goes to the Workout tab. The calendar and the totals fail apart: W96, W97, and W49 for both.

Changes on W30 stay in the app until Save workout.

**Entities:** Workout, Workout exercise, Set.

**Endpoints**

| Method | Route | Used by |
|---|---|---|
| PUT | `/api/v1/workouts/{id}` | W30 Save workout: exercises and sets |
| GET | `/api/v1/exercises/{id}/last-time` | W30, an added exercise's last time `before` the workout's date |
| DELETE | `/api/v1/workouts/{id}` | W32 |
| POST | `/api/v1/workouts/{id}/restore` | Undo after W32 |
| GET | `/api/v1/days` | W40 calendar, with `from` and `to` filters |
| GET | `/api/v1/days/{date}` | W43 to W46 |
| GET | `/api/v1/month-summaries/{yyyy-MM}` | W40 tiles and totals |

**Done when**
- Editing a past workout updates best sets and history everywhere.
- Month totals follow the [month total rules](/product/domain#month-totals-w40).

---

## 7. Settings

**What it does:** you manage your profile photo, theme, color, units, default rest time, name, email and password. You can sign out or delete your account.

**Screens:** H10 Profile, H11 Profile photo, H12 Theme, H13 Color, H14 Units, H15 Default rest time, H16 Name, H17 Email, H18 Change password, H19 Delete account, H25 Password changed email, H27 to H29 Confirming a new email, H30 Confirmation email, H31 Email changed notice, H36 Sign out, H37 Account deleted email, H38 Deletion scheduled email.

**Flows**
- **Open:** the FM avatar on Home → H10.
- **Change a setting:** a row on H10 → its page (H12 to H18) → Save → H10, which says so in a notification. Theme, color, units, default rest time, name, password, email, profile photo, sign out and delete account are built.
- **Rest alerts:** the two switches under Workout on H10 save at once. A failed save switches back and says so (H90). Blocked notifications show a note under Workout (H89).
- **Photo:** H11 → Take photo or Choose from library, dragged and zoomed to a square, made 512 × 512 px on the phone → H39. It also shows on the Home avatar. Remove photo → H41, with an undo bar. With no photo, Remove photo looks muted (H40).
- **Email:** H17 → Save email → the Email row on H10 shows an alert icon, and H33 is H17 with the waiting message and Send link again above the form → link in H30 → H27 → the new email is active, and H31 tells the old address. An expired link opens H28, and no connection H29. The link also works signed out, then goes to A01.
- **Sign out:** → H36 → A01. Without a connection it still signs out on the phone. Signing out, however it happens, clears what the phone holds for the user.
- **Export data:** the row on H10 → the phone's share sheet with a ZIP: one row per set in `workouts.csv`, and `exercises.csv`, `routines.csv`, `account.csv`, one row per feedback message in `feedback.csv` with its screenshots as files in `feedback/`, and the profile photo if there is one. Weights follow the Units setting. On the web it downloads. Then it says "Data exported." (H88), and a failure says so (H87).
- **Delete account:** → H19, with the current password → A01, which says so (A07), and H38 says when. A wrong password shows on H34, and a failure on H35. Signing in within 14 days opens A08, to keep the account. After 14 days a daily job deletes it: an account deleted event tells Training to delete the user's training data, workouts included, and Feedback their tickets, and H37 is the last email.

**Entities:** User, Email change token, Refresh token, Workout settings.

**Endpoints**

| Method | Route | Used by |
|---|---|---|
| GET | `/api/v1/users/me` | H10 |
| PATCH | `/api/v1/users/me` | H12, H13, H14, H16 |
| GET | `/api/v1/users/me/photo` | H10, Home avatar |
| PUT | `/api/v1/users/me/photo` | H11, undo on H41 |
| DELETE | `/api/v1/users/me/photo` | H11 Remove photo |
| PUT | `/api/v1/users/me/password` | H18 |
| GET | `/api/v1/export` | H10 |
| POST | `/api/v1/email-changes` | H17 |
| GET | `/api/v1/email-changes/pending` | H10, H33 |
| POST | `/api/v1/email-changes/resend` | H33 Send link again |
| POST | `/api/v1/email-changes/confirm` | H27, opened from the email link |
| GET | `/links/confirm-email` | Redirect page from the email |
| GET | `/api/v1/workout-settings` | H10 |
| PATCH | `/api/v1/workout-settings` | H15 |
| POST | `/api/v1/sessions/revoke` | H36 Sign out |
| POST | `/api/v1/sessions/restore` | A08 Keep account |
| DELETE | `/api/v1/users/me` | H19 |

**Done when**
- A theme or color change applies to the whole app right away.
- The email only changes after the link is opened.

---

## 8. Home

**What it does:** a dashboard that answers what to do today, whether you're on track, and whether you're getting stronger.

**Screens:** H01 Home, H02 In progress, H03 Completed, H04 Rest day, H05 New account, H06 Skipped, H07 Loading, H08 A section failed, H09 Setup complete, H44 Are you ready.

**Flows**
- **Today:** the one action for the day, Start workout, which asks first on H44, or Resume workout, or what's up next once it's skipped or a rest day; once done, View workout → W67 and what's up next. Open day → the Workout tab on today.
- **This week:** a day → the Workout tab on that day.
- **This month:** workouts, how much of the plan was done, and volume, each compared with last month. Open month → W40, whose back link goes to the Workout tab.
- **Streak:** read-only, with the best so far.
- **Recent records:** a record → E10, with Home as its back link.

**Endpoints**

| Method | Route | Used by |
|---|---|---|
| GET | `/api/v1/days/{date}` | Today |
| GET | `/api/v1/days` | This week |
| GET | `/api/v1/month-summaries/{month}` | This month |
| GET | `/api/v1/streak` | Streak |
| GET | `/api/v1/records/recent` | Recent records |

**Done when**
- Each section loads and fails on its own.
- A new account shows every section, with empty copy.

## 9. Feedback

**What it does:** you send a bug, a suggestion or anything else from the app, with up to 4 screenshots, and read Minimalist's replies in a thread.

**Screens:** F01 Your feedback, F02 No feedback, F03 Loading, F04 Load failure, F10 New feedback, F16 From Home, F20 Ticket, F25 Closed, H91 and H92 Unread reply.

**Flows**
- **Send:** Feedback on H10 → F01 → New feedback → F10, or Send feedback at the end of Home → F10 with Home as its back link. Send feedback → the new ticket's F20, which says "Feedback sent."
- **Read:** a ticket on F01 → F20. Opening it marks Minimalist's replies read, which clears the dots on its row, H10's Feedback row and the Home avatar. Pulling down reads the thread again.
- **Reply:** the reply box on F20, until the ticket is closed.

**Entities:** Ticket, Ticket message, Screenshot.

**Endpoints**

| Method | Route | Used by |
|---|---|---|
| POST | `/api/v1/feedback` | F10 |
| GET | `/api/v1/feedback` | F01 |
| GET | `/api/v1/feedback/unread` | The dots on Home and H10 |
| GET | `/api/v1/feedback/{id}` | F20 |
| GET | `/api/v1/feedback/{id}/screenshots/{screenshotId}` | F20 |
| POST | `/api/v1/feedback/{id}/messages` | F20 |
| PUT | `/api/v1/feedback/{id}/read` | F20 |
| GET | `/api/v1/feedback/export` | Export data on H10 |

**Left to other features:** Minimalist's replies and statuses come with the admin inbox (#84), and push notifications for replies with #85.

**Done when**
- The list, a thread and each screenshot load and fail on their own.
- Deleting an account deletes its feedback.
