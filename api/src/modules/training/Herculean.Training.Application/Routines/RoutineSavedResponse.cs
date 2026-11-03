using System.ComponentModel;

using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.WeekPlan;

namespace Herculean.Training.Application.Routines;

[Description("A saved routine, and the days it took from other routines.")]
internal sealed record RoutineSavedResponse(
    [property: Description("The routine's ID.")] Guid Id,
    [property: Description("The routine's name.")] string Name,
    [property: Description("The weekdays that moved here from another routine, from Monday.")] List<MovedDayResponse> MovedDays)
{
    /// <summary>Leaves out days from deleted routines, which were already rest days and aren't in the names.</summary>
    public static RoutineSavedResponse From(Routine routine, List<MovedDay> movedDays, Dictionary<RoutineId, string> names) =>
        new(
            routine.Id.Value,
            routine.Name,
            [
                .. movedDays
                    .Where(day => names.ContainsKey(day.FromRoutineId))
                    .Select(day => new MovedDayResponse(day.Weekday, names[day.FromRoutineId])),
            ]);
}

[Description("A weekday that moved to this routine from another one.")]
internal sealed record MovedDayResponse(
    [property: Description("The weekday.")] Weekday Weekday,
    [property: Description("The name of the routine it moved from.")] string FromRoutine);
