using System.Globalization;

namespace Herculean.Account.Application.Email;

/// <summary>Dates as people read them, in the user's own time zone.</summary>
internal static class LocalDates
{
    /// <summary>For example "Sun, 8th Nov 2026 at 14:05 (Europe/Zagreb)".</summary>
    public static string FormatTime(DateTimeOffset timeUtc, string timeZone)
    {
        DateTimeOffset local = ToLocal(timeUtc, timeZone);

        return $"{FormatDay(local)} at {local.ToString("HH:mm", CultureInfo.InvariantCulture)} ({timeZone})";
    }

    /// <summary>For example "Sun, 8th Nov 2026".</summary>
    public static string FormatDate(DateTimeOffset timeUtc, string timeZone) => FormatDay(ToLocal(timeUtc, timeZone));

    private static DateTimeOffset ToLocal(DateTimeOffset timeUtc, string timeZone) =>
        TimeZoneInfo.ConvertTime(timeUtc, TimeZoneInfo.FindSystemTimeZoneById(timeZone));

    private static string FormatDay(DateTimeOffset local)
    {
        string weekday = local.ToString("ddd", CultureInfo.InvariantCulture);
        string monthAndYear = local.ToString("MMM yyyy", CultureInfo.InvariantCulture);

        return $"{weekday}, {local.Day}{OrdinalSuffix(local.Day)} {monthAndYear}";
    }

    private static string OrdinalSuffix(int day) =>
        (day % 10, day % 100) switch
        {
            (_, 11 or 12 or 13) => "th",
            (1, _) => "st",
            (2, _) => "nd",
            (3, _) => "rd",
            _ => "th",
        };
}
