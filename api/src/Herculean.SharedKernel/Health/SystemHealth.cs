using System.ComponentModel;

using Herculean.SharedKernel.Auth;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Herculean.SharedKernel.Health;

/// <summary>How each service the API needs is doing, for admins: the health checks tagged <see cref="Tag"/>, in the order they were added.</summary>
public static class SystemHealth
{
    /// <summary>The tag of every check the admin sees.</summary>
    public const string Tag = "system";

    /// <summary>The route of the admin's System health.</summary>
    public const string Route = "/api/v1/admin/health";

    /// <summary>A check that takes longer than this is slow.</summary>
    public static readonly TimeSpan SlowAfter = TimeSpan.FromSeconds(1);

    /// <summary>Adds the API's own check, always first.</summary>
    /// <param name="services">The API's services.</param>
    public static IServiceCollection AddSystemHealth(this IServiceCollection services)
    {
        services.AddHealthChecks()
            .AddCheck("API", () => HealthCheckResult.Healthy("Answering requests."), [Tag]);

        return services;
    }

    /// <summary>Maps <see cref="Route"/>, for admins only.</summary>
    /// <param name="endpoints">The API's endpoints.</param>
    public static void MapSystemHealth(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(Route, HandleAsync)
            .RequireAdmin()
            .WithName("GetSystemHealth")
            .WithTags("System");
    }

    /// <summary>A check's status as the admin sees it.</summary>
    /// <param name="entry">The check's result.</param>
    public static ServiceStatus StatusOf(HealthReportEntry entry) => entry.Status switch
    {
        HealthStatus.Unhealthy => ServiceStatus.Down,
        HealthStatus.Degraded => ServiceStatus.Behind,
        _ => entry.Duration > SlowAfter ? ServiceStatus.Slow : ServiceStatus.Working,
    };

    [EndpointSummary("Check the system")]
    [EndpointDescription("Runs every check of the services the API needs, and says how each is doing. Admins only.")]
    [ProducesResponseType<SystemHealthResponse>(StatusCodes.Status200OK, Description = "Each service, the API first.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    private static async Task<Ok<SystemHealthResponse>> HandleAsync(
        [FromServices] HealthCheckService healthChecks,
        [FromServices] TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        HealthReport report = await healthChecks.CheckHealthAsync(registration => registration.Tags.Contains(Tag), cancellationToken);

        return TypedResults.Ok(ToResponse(report, timeProvider.GetUtcNow()));
    }

    internal static SystemHealthResponse ToResponse(HealthReport report, DateTimeOffset checkedAtUtc) =>
        new(
            checkedAtUtc,
            [
                .. report.Entries.Select(entry => new ServiceHealthResponse(
                    entry.Key,
                    StatusOf(entry.Value),
                    (int)Math.Round(entry.Value.Duration.TotalMilliseconds),
                    entry.Value.Description ?? entry.Value.Exception?.GetType().Name ?? string.Empty)),
            ]);
}

/// <summary>How a service is doing.</summary>
[Description("How a service is doing: working, slow to answer, behind on its work, or down.")]
public enum ServiceStatus
{
    /// <summary>It answers, in good time.</summary>
    Working,

    /// <summary>It answers, but took over a second.</summary>
    Slow,

    /// <summary>It works, but has fallen behind, for example events waiting too long.</summary>
    Behind,

    /// <summary>It doesn't work.</summary>
    Down,
}

/// <summary>How every service is doing.</summary>
/// <param name="CheckedAtUtc">When the checks ran.</param>
/// <param name="Services">Each service, the API first.</param>
[Description("How every service the API needs is doing.")]
public sealed record SystemHealthResponse(
    [property: Description("When the checks ran.")] DateTimeOffset CheckedAtUtc,
    [property: Description("Each service, the API first.")] List<ServiceHealthResponse> Services);

/// <summary>How one service is doing.</summary>
/// <param name="Name">The service, for example Database.</param>
/// <param name="Status">How it is doing.</param>
/// <param name="DurationMs">How long its check took, in milliseconds.</param>
/// <param name="Detail">One line about it, or why it needs attention.</param>
[Description("How one service is doing.")]
public sealed record ServiceHealthResponse(
    [property: Description("The service, for example Database.")] string Name,
    [property: Description("How it is doing.")] ServiceStatus Status,
    [property: Description("How long its check took, in milliseconds.")] int DurationMs,
    [property: Description("One line about it, or why it needs attention.")] string Detail);
