using System.ComponentModel;

using Herculean.Training.Domain.WeekPlan;

namespace Herculean.Training.Application.Routines.CreateRoutine;

[Description("A new routine.")]
internal sealed record CreateRoutineRequest(
    [property: Description("The name, 1 to 100 characters. Spaces around it are removed. It must differ from the user's other routines, regardless of case.")] string Name,
    [property: Description("The weekdays it is on from today, which can be none. Another routine on one of them loses that day.")] List<Weekday> Weekdays,
    [property: Description("Its exercises in order, 1 to 30, each once.")] List<RoutineExerciseItem> Exercises) : IRoutineFields;
