using Herculean.SharedKernel.Results;
using Herculean.Training.Domain.Routines;

namespace Herculean.Training.Domain.Workouts;

internal static class WorkoutErrors
{
    public static readonly Error NotFound = Error.NotFound("workout.not_found", "The workout does not exist.");

    public static readonly Error ExerciseNotFound = Error.NotFound("workout.exercise_not_found", "The workout has no such exercise.");

    public static readonly Error SetNotFound = Error.NotFound("workout.set_not_found", "The exercise has no such set.");

    public static readonly Error DateTaken = Error.Conflict("workout.date_taken", "This day already has a workout.");

    public static readonly Error DateInTheFuture = Error.Conflict("workout.date_in_the_future", "A day that hasn’t come yet can’t have a workout.");

    public static readonly Error BeforeFirstDay = Error.Conflict("workout.before_first_day", "A workout can’t be added before your first day.");

    public static readonly Error NothingPlanned = Error.Conflict("workout.nothing_planned", "This day has no routine.");

    public static readonly Error NoExercises = Error.Conflict("workout.no_exercises", "The routine has no exercises left.");

    public static readonly Error AnotherInProgress = Error.Conflict("workout.another_in_progress", "Resume or finish your workout first.");

    public static readonly Error NothingChecked = Error.Conflict("workout.nothing_checked", "No sets are checked off, so there’s nothing to save.");

    public static readonly Error NotCompleted = Error.Conflict("workout.not_completed", "Only a saved workout can be edited.");

    public static readonly Error NothingToKeep = Error.Conflict("workout.nothing_to_keep", "A saved workout keeps at least one exercise. Delete it instead.");

    public static readonly Error NotInProgress = Error.Conflict("workout.not_in_progress", "The workout is not in progress.");

    public static readonly Error TooManyExercises = Error.Conflict("workout.too_many_exercises", $"A workout can have at most {Routine.MaxExercises} exercises.");

    public static readonly Error ExerciseAlreadyIn = Error.Conflict("workout.exercise_already_in", "This exercise is already in the workout.");

    public static readonly Error ExerciseHasCheckedSets = Error.Conflict("workout.exercise_has_checked_sets", "An exercise with checked sets can’t be swapped. Uncheck them first.");

    public static readonly Error OrderOutOfDate = Error.Conflict("workout.order_out_of_date", "The workout’s exercises have changed. Try again.");

    public static readonly Error TooManySets = Error.Conflict("workout.too_many_sets", $"An exercise can have at most {WorkoutExercise.MaxSets} sets.");

    public static readonly Error SupersetNotTwo = Error.Conflict("workout.superset_not_two", "A superset is two exercises next to each other.");

    public static readonly Error LastSet = Error.Conflict("workout.last_set", "An exercise keeps at least one set. Use the exercise’s trash to remove it.");
}
