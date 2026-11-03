using System.ComponentModel;

using Microsoft.AspNetCore.Mvc;

namespace Herculean.Training.Application.Days.ListDays;

internal sealed record ListDaysRequest(
    [property: FromQuery(Name = "from"), Description("The first date.")] DateOnly From,
    [property: FromQuery(Name = "to"), Description("The last date.")] DateOnly To);
