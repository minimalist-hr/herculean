using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace Herculean.SharedKernel.Results;

/// <summary>Turns errors into HTTP responses for endpoints.</summary>
public static class ErrorProblemExtensions
{
    /// <summary>Turns an error into a Problem Details response, with the status from its <see cref="ErrorType"/>.</summary>
    /// <param name="error">The error to return.</param>
    public static ProblemHttpResult ToProblem(this Error error)
    {
        ProblemDetails problem = error.Type == ErrorType.Validation
            ? new HttpValidationProblemDetails(error.Fields.ToDictionary()) { Status = StatusCodes.Status400BadRequest }
            : new ProblemDetails
            {
                Status = error.Type switch
                {
                    ErrorType.NotFound => StatusCodes.Status404NotFound,
                    ErrorType.Conflict => StatusCodes.Status409Conflict,
                    _ => throw new ArgumentOutOfRangeException(nameof(error), error.Type, "Unknown error type."),
                },
            };

        problem.Detail = error.Description;
        problem.Extensions[ProblemDetailsExtensions.CodeKey] = error.Code;

        return TypedResults.Problem(problem);
    }
}
