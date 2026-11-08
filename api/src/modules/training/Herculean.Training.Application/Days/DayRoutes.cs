namespace Herculean.Training.Application.Days;

internal static class DayRoutes
{
    public const string Tag = "Days";

    public const string Days = "/api/v1/days";

    public const string Day = "/api/v1/days/{date}";

    public const string FirstDay = "/api/v1/days/first";

    public const string Streak = "/api/v1/streak";

    public const string MonthSummary = "/api/v1/month-summaries/{month}";
}
