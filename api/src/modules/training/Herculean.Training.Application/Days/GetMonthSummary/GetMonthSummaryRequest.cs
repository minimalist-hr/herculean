using System.ComponentModel;

using Microsoft.AspNetCore.Mvc;

namespace Herculean.Training.Application.Days.GetMonthSummary;

internal sealed record GetMonthSummaryRequest(
    [property: FromRoute(Name = "month"), Description("The month, as yyyy-MM.")] string Month);
