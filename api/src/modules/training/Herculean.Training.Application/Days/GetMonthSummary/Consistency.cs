namespace Herculean.Training.Application.Days.GetMonthSummary;

internal static class Consistency
{
    /// <summary>Done days out of planned days, at most 100, because a workout on a rest day counts as done. Null with no planned days.</summary>
    public static int? Percent(int done, int planned)
    {
        return planned == 0 ? null : (int)Math.Min(100, Math.Round(100.0 * done / planned, MidpointRounding.AwayFromZero));
    }
}
