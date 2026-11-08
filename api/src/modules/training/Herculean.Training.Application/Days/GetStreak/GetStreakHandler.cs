using Herculean.Training.Application.Auth;

namespace Herculean.Training.Application.Days.GetStreak;

internal sealed class GetStreakHandler(IDayReadRepository dayReadRepository, UserClock userClock)
{
    private const int DaysInWeek = 7;

    public async Task<StreakResponse> HandleAsync(CancellationToken cancellationToken)
    {
        List<PlanChange> changes = await dayReadRepository.ListPlanChangesAsync(cancellationToken);
        if (changes.Count == 0)
        {
            return new StreakResponse(0, 0);
        }

        UserCalendar calendar = await userClock.GetCalendarAsync(cancellationToken);
        DateOnly earliest = changes.Min(change => change.EffectiveFrom);
        DateOnly thisMonday = MondayOf(calendar.Today);
        HashSet<DateOnly> workoutDates = [.. (await dayReadRepository.ListWorkoutsAsync(earliest, thisMonday, cancellationToken)).Select(workout => workout.Date)];
        DayPlan plan = new(changes, calendar);

        int weeks = 0;
        int best = 0;
        for (DateOnly week = MondayOf(earliest); week < thisMonday; week = week.AddDays(DaysInWeek))
        {
            List<DateOnly> planned = [.. Enumerable.Range(0, DaysInWeek).Select(week.AddDays).Where(date => plan.RoutineOn(date) is not null)];
            if (planned.Exists(date => !workoutDates.Contains(date)))
            {
                weeks = 0;
            }
            else if (planned.Count > 0)
            {
                // A week with nothing planned neither counts nor breaks the streak.
                weeks++;
                best = Math.Max(best, weeks);
            }
        }

        return new StreakResponse(weeks, best);
    }

    private static DateOnly MondayOf(DateOnly date) => date.AddDays(-(((int)date.DayOfWeek + 6) % DaysInWeek));
}
