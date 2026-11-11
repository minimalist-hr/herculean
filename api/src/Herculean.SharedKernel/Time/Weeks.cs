namespace Herculean.SharedKernel.Time;

/// <summary>Weeks that end now: the last 7 days, the 7 before them, and so on. The same on every day of the week.</summary>
public static class Weeks
{
    /// <summary>How many weeks a trend line shows.</summary>
    public const int TrendLength = 4;

    private static readonly TimeSpan Week = TimeSpan.FromDays(7);

    /// <summary>When the week <paramref name="weeksAgo"/> weeks back started. 0 is the last 7 days.</summary>
    /// <param name="now">Now.</param>
    /// <param name="weeksAgo">How many weeks back.</param>
    public static DateTimeOffset StartOf(DateTimeOffset now, int weeksAgo) => now - (Week * (weeksAgo + 1));

    /// <summary>Counts moments into weeks, oldest first, with the last 7 days last. Moments outside them are left out.</summary>
    /// <param name="moments">The moments to count.</param>
    /// <param name="now">Now.</param>
    /// <param name="weeks">How many weeks.</param>
    public static List<int> Count(IEnumerable<DateTimeOffset> moments, DateTimeOffset now, int weeks = TrendLength)
    {
        int[] counts = new int[weeks];
        foreach (DateTimeOffset moment in moments)
        {
            if (IndexOf(moment, now, weeks) is int index)
            {
                counts[index]++;
            }
        }

        return [.. counts];
    }

    /// <summary>Which of the weeks a moment falls in, oldest first, or null when it is in none of them.</summary>
    /// <param name="moment">The moment.</param>
    /// <param name="now">Now.</param>
    /// <param name="weeks">How many weeks.</param>
    public static int? IndexOf(DateTimeOffset moment, DateTimeOffset now, int weeks = TrendLength)
    {
        int weeksAgo = (int)Math.Floor((now - moment) / Week);

        return moment <= now && weeksAgo < weeks ? weeks - 1 - weeksAgo : null;
    }
}
