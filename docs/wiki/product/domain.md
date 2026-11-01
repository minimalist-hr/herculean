---
title: Domain and entities
---

Terms on this page are used unchanged in the app, API, database and docs. Properties and relations are in the [ER diagram](/product/er-diagram).

## Terms

| Term | Meaning |
|---|---|
| User | A person with an account. The user is the tenant: every piece of training data belongs to one user. |
| Group | A muscle group, for example Chest. Orders the exercise list and the chips. |
| Exercise | Something you train, for example Barbell curl. Has one group and optional "also works" groups. |
| Routine | A named list of exercises with targets. A template for a workout. |
| Target | Sets and a rep range for an exercise in a routine, for example 3 × 8–10. |
| Week plan | What you train on each weekday. It repeats every week. |
| Week plan day | One weekday in the week plan: a routine, or a rest day. |
| Rest day | A weekday with no routine. |
| Workout | What you did on one date: its exercises and sets. |
| Set | Weight and reps for one exercise in a workout. A bodyweight set has weight 0. |
| Checked set | A set marked done while logging. |
| Workout settings | Default rest time, rest sound and rest vibrate. |
| Best set | The heaviest weight for an exercise, then the most reps at that weight. |
| Record | A set that beats every earlier set of that exercise, by heaviest weight or by most reps at a weight. |
| Volume | Weight × reps, summed over sets. |

## Modules and aggregates

| Module | Aggregate | Child entities |
|---|---|---|
| Account | User | Refresh token, Password reset token, Email change token |
| Training | Workout settings | |
| Training | Group | |
| Training | Exercise | Exercise also works |
| Training | Routine | Routine exercise |
| Training | Week plan day | |
| Training | Workout | Workout exercise, Set |

## Rules

### Account

- An email is unique and not case-sensitive.
- A password has at least 8 characters.
- A name has 1 to 50 characters, trimmed.
- Password reset and email change links expire. Their lifetimes are in [Configuration](/development/configuration#api-settings).
- A password reset link works once, and a new one cancels older ones.
- Resetting the password deletes every refresh token, so every device is signed out.
- An email change takes effect only when the link in the email is opened.
- Sign out deletes that device's refresh token.
- Changing the password deletes every refresh token except the current one.
- A token is deleted once it is used or revoked.
- Deleting an account deletes all its data. There is no undo.
- A new account gets the name, units and default rest time from A30, the 6 groups (Chest, Back, Shoulders, Biceps, Triceps, Legs) and no exercises.
- The greeting uses the first word of the name.

### Units and time

- Weight is stored in kg. Imperial users see pounds, rounded to 0.1.
- The weight steppers (L10) change by 2.5 kg, or by 5 lb for imperial users.
- The default rest time moves in 15 second steps, from 0:15 to 10:00. It starts at 3:00. Setup (A30) and Settings (H15) also offer quick picks: 1, 2, 3, 4 and 5 minutes.
- Times are stored in UTC. Dates and day logic use the user's time zone.
- The app sends the phone's time zone, and it is stored on the user.

### Week plan

- The week plan repeats every week.
- A weekday with no week plan day is a rest day.
- A change applies from today on. Past days keep the plan they had.
- Picking another routine for today (W10) starts today's workout from it. The week plan does not change.

### Workouts

- A user has at most one workout per date, and at most one workout in progress.
- A workout belongs to the user's local date when it started.
- A workout can start from a routine. Its name and exercises are copied when it starts, so later routine changes do not affect it.
- Each set of a new workout starts with the weight and reps of the same set last time. If there was no last time, it starts at 0 kg and the low end of the target reps.
- Logging a past day (W21) gives the workout that date. The start time is when logging started.
- Skip workout creates a skipped workout with no sets. Undo skip deletes it.
- Logging a skipped day (W22) turns its skipped workout into a workout in progress.
- Save workout removes unchecked sets and marks the workout completed.
- Discard workout deletes a workout in progress.

### How a day is shown

| Day has | Shown as |
|---|---|
| A completed workout | Done |
| A skipped workout | Skipped |
| A workout in progress | In progress |
| No workout, a routine planned, the day is past | Missed |
| No workout, a routine planned, today or later | Planned |
| No workout, no routine planned | Rest day |

### Exercises, routines and groups

- An exercise's name has 1 to 100 characters, trimmed. It differs from the user's other exercises, regardless of case. A deleted exercise's name can be used again.
- A user can have at most 500 exercises, so the exercise list can load whole.
- An exercise's "also works" groups can't repeat a group, or include the group it belongs to.
- Edits to an exercise show everywhere, past workouts included.
- Deleting an exercise removes it from routines. Past workouts keep it.
- Deleting a routine turns its weekdays into rest days from today on. Past workouts keep their name.
- A group can only be deleted when no exercise uses it, as its group or as "also works".

### Delete and undo

- Every removal has an undo, except deleting the account, a routine or an exercise. Those ask first instead.
- Workouts, routines, exercises and groups are soft-deleted. Undo restores workouts and groups. Deleted routines and exercises stay, so past workouts keep their names.
- Sets, exercises in a workout and the profile photo are added back on undo.
- Removals in an edit screen before Save (W31, R20) are undone in the app. The server never sees them.

### Month totals (W40)

- **Time trained:** the sum of workout durations.
- **Sets:** checked sets, out of the target sets of planned days.
- **Volume:** volume of all sets.
- **Consistency:** done days out of planned days so far.
