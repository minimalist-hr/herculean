using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.DependencyInjection;

namespace Herculean.SharedKernel.Results;

/// <summary>Gives every error response the same fields, including the ones ASP.NET Core creates.</summary>
public static class ProblemDetailsExtensions
{
    internal const string CodeKey = "code";

    /// <summary>Adds Problem Details where every error has a type, title, status, detail, code and trace ID.</summary>
    /// <param name="services">The API's services.</param>
    public static IServiceCollection AddStandardProblemDetails(this IServiceCollection services)
    {
        services.AddProblemDetails(options => options.CustomizeProblemDetails = context => Standardize(context.ProblemDetails));
        services.Configure<ExceptionHandlerOptions>(options => options.StatusCodeSelector = StatusCodeFor);

        return services;
    }

    // ASP.NET Core has already set the type and trace ID. Only 400 from validation keeps its errors.
    internal static void Standardize(ProblemDetails problem)
    {
        int status = problem.Status ?? StatusCodes.Status500InternalServerError;
        string title = ReasonPhrases.GetReasonPhrase(status);

        problem.Status = status;
        problem.Title = title;
        problem.Detail ??= title;
        problem.Extensions.TryAdd(CodeKey, title.ToLowerInvariant().Replace(' ', '_'));
    }

    // A body that can't be read, for example an unknown enum value, is the caller's mistake: 400.
    // In Development ASP.NET Core throws it, and every other exception is a bug: 500.
    internal static int StatusCodeFor(Exception exception) =>
        exception is BadHttpRequestException badRequest ? badRequest.StatusCode : StatusCodes.Status500InternalServerError;
}
