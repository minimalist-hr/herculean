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
| Superset | Two neighbouring exercises done one after the other: a set of each, then rest. |
| Lengthened partials | Half reps at the stretched end of an exercise, right after a set. |
| Week plan | What you train on each weekday. It repeats every week. |
| Week plan day | One weekday in the week plan: a routine, or a rest day. |
| Rest day | A weekday with no routine. |
| Workout | What you did on one date: its exercises and sets. |
| Set | Weight and reps for one exercise in a workout. A bodyweight set has weight 0. |
| Checked set | A set marked done while logging. |
| Workout settings | Default rest time, rest sound and rest vibrate. |
| Best set | The heaviest weight for an exercise, then the most reps at that weight, from checked sets in completed workouts. Its date is the first workout that did it. |
| Record | A set that beats every set of that exercise on earlier dates, by heaviest weight or by most reps at a weight done before. An exercise's first session has none, and a workout shows at most one per exercise, heaviest weight first. |
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
- A password has 8 to 128 characters.
- A name has 1 to 50 characters, trimmed.
- Password reset and email change links expire. Their lifetimes are in [Configuration](/development/configuration#api-settings).
- A password reset link works once, and a new one cancels older ones.
- Resetting the password deletes every refresh token, so every device is signed out.
- An email change needs the current password, and takes effect only when the link in the email is opened. A new link cancels older ones. The old address is told, and a reset link sent to it stops working.
- Sign out deletes that device's refresh token.
- Changing the password deletes every refresh token except the current one, and emails the user.
- A token is deleted once it is used or revoked.
- Deleting an account needs the current password, signs out every device and schedules the deletion for 14 days later. An email says when. Signing in before then offers to keep the account, and the email address stays taken until the deletion.
- After the 14 days, all the account's data is deleted, soft-deleted rows included, and there is no undo. A last email tells the user.
- A new account gets the name, units and default rest time from A30, the 6 groups (Chest, Back, Shoulders, Biceps, Triceps, Legs) and 28 starter exercises, which can be edited or deleted like any other:
  - Chest: Flat barbell bench press (also Shoulders, Triceps), Incline dumbbell bench press (Triceps), Cable crossover, Smith machine incline bench press (Shoulders, Triceps), Flat dumbbell bench press (Triceps), Machine crossover.
  - Back: Pull-up (Biceps), Machine row, Lat pulldown, T-bar row, Cable row.
  - Shoulders: Smith machine press, Dumbbell press, Lateral dumbbell raise, Machine press, Lateral machine raise.
  - Biceps: EZ bar curl, Incline dumbbell curl, Barbell curl, Incline hammer curl.
  - Triceps: EZ bar skullcrusher, Rope pushdown, Parallel bar dips (Chest), Straight bar pushdown.
  - Legs: Barbell squat, Romanian deadlift, Leg extension, Smith machine calf raise.
- The greeting uses the first word of the name.

### Units and time

- Weight is stored in kg. Imperial users see pounds, rounded to 0.1. Every weight and volume the app shows follows the units setting.
- The weight steppers (L10) change by 2.5 kg, or by 5 lb for imperial users.
- The default rest time moves in 15 second steps, from 0:15 to 10:00. It starts at 3:00. Setup (A30) and Settings (H15) also offer quick picks: 1, 2, 3, 4 and 5 minutes.
- Times are stored in UTC. Dates and day logic use the user's time zone.
- The app sends the phone's time zone when the account is created, and again whenever the app opens or wakes up in another zone. It is stored on the user.

### Week plan

- The week plan repeats every week.
- A weekday with no week plan day is a rest day.
- A change applies from today on. Past days keep the plan they had.

### Workouts

- A user has at most one workout per date, and at most one workout in progress.
- A workout belongs to the user's local date when it started.
- A workout can start from a routine. Its name and exercises are copied when it starts, supersets included, so later routine changes do not affect it.
- A superset in a workout ends when either exercise is removed, or a reorder or save leaves them apart. Undoing a removal brings it back. A swap keeps it.
- While logging and when editing a saved workout, an exercise can be paired with the one after it or unpaired, and two exercises added together can be added as a superset. The routine doesn't change.
- Each set of a new workout starts with the weight and reps of the same set last time. If last time had fewer sets, it takes the last of them. If there was no last time, it starts at 0 kg and the low end of the target reps.
- Last time is the exercise's latest completed workout before this workout's date.
- Logging a past day (W21) gives the workout that date. It has no timer, so its duration is entered on L32, in minutes, or left out.
- A saved workout's duration can be corrected on W30. It is 1 to 600 minutes, or left out.
- Changing a set's weight or reps also changes it on later unchecked sets of that exercise, unless they were changed by hand. A new set copies the last set. A set put back by Undo counts as changed by hand.
- An exercise in a workout has 1 to 20 sets. Its last set can't be removed: the exercise is removed instead.
- Sets can only change while the workout is in progress.
- An exercise can be swapped in a workout only while none of its sets are checked. The new one keeps the set count and targets, and takes its values from its own last time. The routine doesn't change. Undo brings back the exercise and the values it had.
- A workout has at most 30 exercises, each once. An added exercise goes last, at 3 × 8–10, with sets from last time. Every exercise can be removed, which leaves the workout empty until one is added.
- A set's weight is 0 to 1,000 kg, with up to two decimals, and 0 means bodyweight. Its reps are 1 to 100.
- Skip workout creates a skipped workout with the routine's name, exercises and targets, and no sets, so later routine changes do not affect it. It works on today or a past day with a routine. Undo skip deletes it, and the day reads from the week plan again.
- Save workout removes unchecked sets and marks the workout completed.
- Discard workout deletes a workout in progress.

### Rest timer

- It never starts by itself. A checked set opens it, ready to start, with the default rest time.
- It doesn't appear after the last set of a workout, or on a past day.
- In a superset it waits for a set of each: checking the first exercise's set doesn't open it while the second has that set to do.
- Checking another set stops it and makes it ready again. A time changed before starting stays for that exercise, within 0:15 to 10:00, and the next exercise goes back to the default. While running, −15 and +15 change only that rest.
- Past zero it counts up, until Done.
- Hidden, it keeps running, and checking a set doesn't open it again until it is opened by hand. Skip and Done tuck it away, and the next checked set opens it.
- Unchecking a set hides a timer that hasn't started, and leaves a running one alone.
- It lives on the phone, and survives closing the app.
- When it runs out, a notification says "Rest is over", even with the phone locked. Its sound and vibration follow the two settings on H10. The app asks to send notifications the first time a timer starts. Stopping the timer, or saving the workout, cancels it. Tapping it opens the workout's logging page.

### How a day is shown

| Day has | Shown as |
|---|---|
| A completed workout | Done |
| A skipped workout | Skipped |
| A workout in progress | In progress |
| No workout, a routine planned, the day is past | Missed |
| No workout, a routine planned, today or later | Planned |
| No workout, no routine planned | Rest day |

### What you can do on a day

One workout per date, and a workout only happens on today or a past day.

| Day | State | Actions |
|---|---|---|
| Today | Planned | Start workout, Other routine, Skip workout |
| Today | Rest | Other routine |
| Today | No routines at all | New routine |
| Today or past | In progress | Resume workout |
| Today or past | Completed | View workout, Edit, Delete |
| Today or past | Skipped | Undo skip |
| Past | Missed | Log workout, Other routine, Skip workout |
| Past | Rest | Other routine |
| Future | Planned | Start workout, Other routine, Skip workout, all muted |
| Future | Rest | Other routine, muted |

| Action | What it does | The day then shows |
|---|---|---|
| Start workout, Log workout | Starts from the day's routine, copying its name, exercises and targets. Exercises deleted since are left out. If none are left, only Other routine and Skip workout are offered. | In progress |
| Other routine | Starts from a routine picked on W10, which lists the week plan's routines and the day's planned one. W57 asks first. It counts for that date only, and the week plan does not change. | In progress |
| Skip workout | Asks first, then copies the routine | Skipped |
| Undo skip | Asks first, then deletes the skip | Its plan |
| Save workout | Finishes logging. Unchecked sets are removed, and so is any exercise left with no sets. It needs a checked set. | Completed |
| Discard workout | Asks first, then deletes the workout in progress and offers an undo, which puts it back in progress | Its plan |
| Delete | Asks first, then offers an undo | Its plan |

- "Its plan" is planned, missed or rest, from the week plan on that date.
- Only one workout can be in progress. While one runs on another day, Start workout, Log workout and Other routine look muted, and tapping one says to resume or finish it first.
- On a future day, the actions look muted, and tapping one says a workout can't be started or skipped before its day.
- A workout that runs past midnight stays on the date it started.
- The first day is the earlier of the first workout and the day the account was created, so imported workouts extend it. The week strip reaches from its week to 4 weeks ahead. A workout can't be added before it, except by an import, so Other routine looks muted there and says why.
- A workout keeps its copy when its routine changes or is deleted. Exercise renames show everywhere.

Every action in the table is built.

### Exercises, routines and groups

- An exercise's name has 1 to 100 characters, trimmed. It differs from the user's other exercises, regardless of case. A deleted exercise's name can be used again.
- A user can have at most 500 exercises, so the exercise list can load whole.
- An exercise's "also works" groups can't repeat a group, or include the group it belongs to.
- Edits to an exercise show everywhere, past workouts included.
- An exercise in a routine can't be deleted: remove it from its routines first. Past workouts keep a deleted exercise.
- A routine's name has 1 to 100 characters, trimmed. It differs from the user's other routines, regardless of case. A deleted routine's name can be used again.
- A user can have at most 50 routines.
- A routine has 1 to 30 exercises when saved, each once.
- A routine's days are saved with the routine. A day holds one routine, so picking a day another routine has moves it. A change applies from today on.
- A target has 1 to 20 sets, and a rep range from 1 to 100 whose low end isn't above its high end.
- An exercise in a routine can be a superset with the exercise after it, set on its targets or by adding two exercises as a superset. A superset is two exercises, so the last exercise and the second of a superset can't start one.
- An exercise in a routine can have lengthened partials after each set. A workout copies the flag, and it can be turned on or off for that workout only.
- A set records whether lengthened partials were done after it. They never count toward volume or records.
- Deleting a routine turns its weekdays into rest days from the date it was deleted, in the user's time zone. Earlier days keep their plan, and past workouts keep their name. Undo brings the weekdays back.
- A group's name has 1 to 30 characters, trimmed. It differs from the user's other groups, regardless of case. A deleted group's name can be used again.
- A user can have at most 50 groups.
- A group can only be deleted when no exercise uses it, as its group or as "also works".

### Delete and undo

- Every removal has an undo, except deleting the account, which asks first instead.
- Workouts, routines, exercises and groups are soft-deleted. Undo restores them. A deleted one stays, so past workouts keep its name. Restoring fails if its name was reused, or if a routine's exercise or an exercise's group is gone.
- Sets, exercises in a workout and the profile photo are added back on undo.
- Removals in an edit screen before Save (W31, R20) are undone in the app. The server never sees them.

### Streak and records

- A streak counts finished weeks in a row with no planned day missed. A skipped day doesn't break it, a workout left in progress counts as missed, a week with nothing planned is passed over, and this week doesn't count until it's over.
- Home's Recent records are only heaviest-weight [records](#terms), never a bodyweight set: the newest three from the last 30 days, one per exercise.

### Month totals (W40)

- **Time trained:** the sum of workout durations. A workout with no duration adds nothing.
- **Sets:** checked sets, out of the sets planned so far: the routine's target sets on each planned day, and on any day with a workout. Saving keeps the planned sets, even when it removes an exercise left with no sets.
- **Volume:** volume of checked sets.
- **On plan:** done days out of planned days so far, at most 100%. It shows "–" with no planned days yet.
- A skip counts as not done. A workout on a rest day counts as done, and its sets as planned, but its day isn't planned. A workout in progress counts towards nothing until it's finished.
- Planned days so far are past days, plus today once its workout is done or skipped.
