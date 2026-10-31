using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Http;

namespace Herculean.SharedKernel.UnitTests.Results;

public sealed class ErrorProblemExtensionsTests
{
    [Fact]
    public void ValidationErrorIsBadRequestWithFieldErrors()
    {
        Dictionary<string, string[]> fields = new() { ["email"] = ["Enter an email."] };

        var problem = Error.Validation(fields).ToProblem();

        problem.StatusCode.ShouldBe(StatusCodes.Status400BadRequest);
        problem.ProblemDetails.ShouldBeOfType<HttpValidationProblemDetails>().Errors.ShouldBe(fields);
        problem.ProblemDetails.Detail.ShouldBe("One or more fields are not valid.");
        problem.ProblemDetails.Extensions["code"].ShouldBe("validation");
    }

    [Fact]
    public void NotFoundErrorIsNotFound()
    {
        var problem = Error.NotFound("routine.not_found", "The routine was not found.").ToProblem();

        problem.StatusCode.ShouldBe(StatusCodes.Status404NotFound);
        problem.ProblemDetails.Detail.ShouldBe("The routine was not found.");
        problem.ProblemDetails.Extensions["code"].ShouldBe("routine.not_found");
    }

    [Fact]
    public void ConflictErrorIsConflict()
    {
        var problem = Error.Conflict("user.email_taken", "This email is already used.").ToProblem();

        problem.StatusCode.ShouldBe(StatusCodes.Status409Conflict);
        problem.ProblemDetails.Detail.ShouldBe("This email is already used.");
        problem.ProblemDetails.Extensions["code"].ShouldBe("user.email_taken");
    }
}
