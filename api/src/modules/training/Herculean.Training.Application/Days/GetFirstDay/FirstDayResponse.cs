using System.ComponentModel;

namespace Herculean.Training.Application.Days.GetFirstDay;

[Description("The first day the user can reach.")]
internal sealed record FirstDayResponse(
    [property: Description("The earlier of the first workout and the day the account was created, in the user's time zone.")] DateOnly Date);
