using System.ComponentModel;

namespace Herculean.Training.Application.Days.GetMonthSummary;

[Description("A month's counts and totals.")]
internal sealed record MonthSummaryResponse(
    [property: Description("Days with a completed workout.")] int Done,
    [property: Description("Planned days that passed with nothing logged.")] int Missed,
    [property: Description("Days with a skipped workout.")] int Skipped,
    [property: Description("The sum of workout durations, in minutes.")] int MinutesTrained,
    [property: Description("Checked sets.")] int SetsDone,
    [property: Description("The target sets of planned days so far.")] int SetsPlanned,
    [property: Description("Weight times reps over all sets, in kilograms.")] decimal VolumeKg,
    [property: Description("Planned days so far: past days, plus today once its workout is done or skipped.")] int PlannedDays,
    [property: Description("Done days out of planned days so far, from 0 to 100. Null with no planned days yet.")] int? ConsistencyPercent);
