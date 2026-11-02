using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.WeekPlan.ListWeekPlanDays;

internal static class ListWeekPlanDaysEndpoint
{
    internal const string Name = "ListWeekPlanDays";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(WeekPlanRoutes.WeekPlanDays, HandleAsync)
            .WithName(Name)
            .WithTags(WeekPlanRoutes.Tag);
    }

    [EndpointSummary("List the week plan")]
    [EndpointDescription("Returns what each weekday holds now for the signed-in user, always seven days from Monday. A day with no routine is a rest day.")]
    [ProducesResponseType<List<WeekPlanDayResponse>>(StatusCodes.Status200OK, Description = "The seven days.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    private static async Task<Ok<List<WeekPlanDayResponse>>> HandleAsync(
        [FromServices] ListWeekPlanDaysHandler handler,
        CancellationToken cancellationToken)
    {
        return TypedResults.Ok(await handler.HandleAsync(cancellationToken));
    }
}
