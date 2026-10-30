---
title: ER diagram
---

Terms and rules are in [Domain and entities](/product/domain). Database naming is in [Conventions](/development/conventions#naming).

## Common properties

Every entity has these.

| Property | Type | Notes |
|---|---|---|
| Id | typed ID, for example `ExerciseId` | Wraps a UUID v7 |
| CreatedAtUtc | DateTimeOffset | |
| UpdatedAtUtc | DateTimeOffset | |

Properties ending in `Utc` are points in time in UTC. `DateOnly` properties are dates in the user's time zone.

## Account

```mermaid
erDiagram
    User ||--o{ RefreshToken : has
    User ||--o{ PasswordResetToken : has
    User ||--o{ EmailChangeToken : has
```

### User

| Property | Type | Notes |
|---|---|---|
| Email | string | Unique, case-insensitive |
| PasswordHash | string | |
| Name | string? | Empty until setup (A30) |
| Photo | byte[]? | |
| PhotoContentType | string? | |
| TimeZone | string | IANA name, for example `Europe/Zagreb` |
| Theme | enum | `MatchPhone`, `Dark`, `Light`. Starts at `MatchPhone` |
| Color | enum | `RacingBlue`, `Titanium`. Starts at `RacingBlue` |
| Units | enum | `Metric`, `Imperial`. Starts at `Metric` |
| RefreshTokens | list of RefreshToken | |
| PasswordResetTokens | list of PasswordResetToken | |
| EmailChangeTokens | list of EmailChangeToken | |

### RefreshToken

| Property | Type | Notes |
|---|---|---|
| UserId | UserId | → User |
| User | User | |
| TokenHash | string | |
| ExpiresAtUtc | DateTimeOffset | |

### PasswordResetToken

| Property | Type | Notes |
|---|---|---|
| UserId | UserId | → User |
| User | User | |
| TokenHash | string | |
| ExpiresAtUtc | DateTimeOffset | |

### EmailChangeToken

| Property | Type | Notes |
|---|---|---|
| UserId | UserId | → User |
| User | User | |
| NewEmail | string | |
| TokenHash | string | |
| ExpiresAtUtc | DateTimeOffset | |

## Training

Every Training entity has a `UserId` (type `UserId`). It has no foreign key to the Account module.

```mermaid
erDiagram
    Group ||--o{ Exercise : "is group of"
    Exercise ||--o{ ExerciseAlsoWorks : has
    Group ||--o{ ExerciseAlsoWorks : "is also worked by"
    Routine ||--o{ RoutineExercise : has
    Exercise ||--o{ RoutineExercise : "is used in"
    Routine |o--o{ WeekPlanDay : "is planned on"
    Routine |o--o{ Workout : "is template of"
    Workout ||--o{ WorkoutExercise : has
    Exercise ||--o{ WorkoutExercise : "is done in"
    WorkoutExercise ||--o{ Set : has
```

### TrainingSettings

| Property | Type | Notes |
|---|---|---|
| UserId | UserId | Unique |
| DefaultRestSeconds | int | Starts at 90 |
| RestSound | bool | Starts on |
| RestVibrate | bool | Starts on |

### Group

| Property | Type | Notes |
|---|---|---|
| UserId | UserId | |
| Name | string | Unique per user among groups that are not deleted |
| Order | int | |
| DeletedAtUtc | DateTimeOffset? | |
| Exercises | list of Exercise | |

### Exercise

| Property | Type | Notes |
|---|---|---|
| UserId | UserId | |
| Name | string | |
| GroupId | GroupId | → Group |
| Group | Group | |
| AlsoWorks | list of ExerciseAlsoWorks | |
| DeletedAtUtc | DateTimeOffset? | |

### ExerciseAlsoWorks

| Property | Type | Notes |
|---|---|---|
| ExerciseId | ExerciseId | → Exercise |
| GroupId | GroupId | → Group. Unique together with ExerciseId |
| Group | Group | |

### Routine

| Property | Type | Notes |
|---|---|---|
| UserId | UserId | |
| Name | string | |
| DeletedAtUtc | DateTimeOffset? | |
| Exercises | list of RoutineExercise | |

### RoutineExercise

| Property | Type | Notes |
|---|---|---|
| RoutineId | RoutineId | → Routine |
| ExerciseId | ExerciseId | → Exercise |
| Exercise | Exercise | |
| Order | int | |
| TargetSets | int | Starts at 3 |
| TargetRepsFrom | int | Starts at 8 |
| TargetRepsTo | int | Starts at 10 |

### WeekPlanDay

| Property | Type | Notes |
|---|---|---|
| UserId | UserId | |
| Weekday | enum | `Monday` to `Sunday` |
| RoutineId | RoutineId? | → Routine. Empty means rest day |
| Routine | Routine? | |
| EffectiveFrom | DateOnly | Unique per user together with Weekday |

### Workout

| Property | Type | Notes |
|---|---|---|
| UserId | UserId | |
| Date | DateOnly | Unique per user among workouts that are not deleted |
| Name | string | |
| Status | enum | `InProgress`, `Completed`, `Skipped` |
| RoutineId | RoutineId? | → Routine |
| Routine | Routine? | |
| StartedAtUtc | DateTimeOffset? | Empty when skipped |
| FinishedAtUtc | DateTimeOffset? | Empty while in progress and when skipped |
| DeletedAtUtc | DateTimeOffset? | |
| Exercises | list of WorkoutExercise | |

### WorkoutExercise

| Property | Type | Notes |
|---|---|---|
| WorkoutId | WorkoutId | → Workout |
| ExerciseId | ExerciseId | → Exercise |
| Exercise | Exercise | |
| Order | int | |
| Sets | list of Set | |

### Set

| Property | Type | Notes |
|---|---|---|
| WorkoutExerciseId | WorkoutExerciseId | → WorkoutExercise |
| Order | int | Shown as the set number |
| WeightKg | decimal(9,3) | |
| Reps | int | |
| Checked | bool | |
