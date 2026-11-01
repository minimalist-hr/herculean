using System.Text.Json;

using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace Herculean.SharedKernel.UnitTests.Results;

public sealed class ProblemDetailsExtensionsTests
{
    [Fact]
    public async Task AValueThatCantBeReadIsABadRequestWithoutAnException()
    {
        WebApplicationBuilder builder = WebApplication.CreateSlimBuilder(new WebApplicationOptions { EnvironmentName = Environments.Development });
        builder.WebHost.UseTestServer();
        builder.Services.AddRouting();
        builder.Services.AddStandardProblemDetails();
        await using WebApplication app = builder.Build();
        app.Services.GetRequiredService<IOptions<RouteHandlerOptions>>().Value.ThrowOnBadRequest.ShouldBeFalse();
        app.UseExceptionHandler();
        app.UseStatusCodePages();
        app.MapGet("/items", ([FromQuery] Guid? groupId) => TypedResults.Ok(groupId));
        await app.StartAsync(TestContext.Current.CancellationToken);
        using HttpClient client = app.GetTestClient();

        using HttpResponseMessage response = await client.GetAsync(new Uri("/items?groupId=not-an-id", UriKind.Relative), TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(System.Net.HttpStatusCode.BadRequest);
        using JsonDocument problem = JsonDocument.Parse(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        problem.RootElement.GetProperty("code").GetString().ShouldBe("bad_request");
        await app.StopAsync(TestContext.Current.CancellationToken);
    }

    [Fact]
    public void ProblemWithOnlyAStatusGetsEveryField()
    {
        ProblemDetails problem = new() { Status = StatusCodes.Status404NotFound };

        ProblemDetailsExtensions.Standardize(problem);

        problem.Title.ShouldBe("Not Found");
        problem.Detail.ShouldBe("Not Found");
        problem.Extensions["code"].ShouldBe("not_found");
    }

    [Fact]
    public void ProblemWithoutAStatusIsAServerError()
    {
        ProblemDetails problem = new();

        ProblemDetailsExtensions.Standardize(problem);

        problem.Status.ShouldBe(StatusCodes.Status500InternalServerError);
        problem.Extensions["code"].ShouldBe("internal_server_error");
    }

    [Fact]
    public void OwnDetailAndCodeAreKept()
    {
        ProblemDetails problem = new() { Status = StatusCodes.Status409Conflict, Detail = "Taken.", Extensions = { ["code"] = "user.email_taken" } };

        ProblemDetailsExtensions.Standardize(problem);

        problem.Detail.ShouldBe("Taken.");
        problem.Extensions["code"].ShouldBe("user.email_taken");
    }

    [Fact]
    public void BodyThatCannotBeReadIsABadRequest()
    {
        ProblemDetailsExtensions.StatusCodeFor(new BadHttpRequestException("Failed to read the request body as JSON."))
            .ShouldBe(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public void OtherExceptionIsAServerError()
    {
        ProblemDetailsExtensions.StatusCodeFor(new InvalidOperationException()).ShouldBe(StatusCodes.Status500InternalServerError);
    }

    [Fact]
    public void ExceptionHandlerUsesTheStatusCodes()
    {
        ServiceCollection services = new();
        services.AddStandardProblemDetails();

        using ServiceProvider provider = services.BuildServiceProvider();
        provider.GetRequiredService<IOptions<ExceptionHandlerOptions>>().Value.StatusCodeSelector
            .ShouldNotBeNull()(new BadHttpRequestException("Bad.")).ShouldBe(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task ValidationErrorResponseHasEveryField()
    {
        Error error = Error.Validation(new Dictionary<string, string[]> { ["email"] = ["Enter an email."] });

        JsonElement body = await WriteAsync(error.ToProblem());

        body.GetProperty("type").GetString().ShouldNotBeNullOrEmpty();
        body.GetProperty("title").GetString().ShouldBe("Bad Request");
        body.GetProperty("status").GetInt32().ShouldBe(StatusCodes.Status400BadRequest);
        body.GetProperty("detail").GetString().ShouldBe(error.Description);
        body.GetProperty("code").GetString().ShouldBe("validation");
        body.GetProperty("errors").GetProperty("email")[0].GetString().ShouldBe("Enter an email.");
        body.GetProperty("traceId").GetString().ShouldNotBeNullOrEmpty();
    }

    [Fact]
    public async Task ConflictResponseHasEveryFieldButErrors()
    {
        JsonElement body = await WriteAsync(Error.Conflict("user.email_taken", "Taken.").ToProblem());

        body.GetProperty("title").GetString().ShouldBe("Conflict");
        body.GetProperty("detail").GetString().ShouldBe("Taken.");
        body.GetProperty("code").GetString().ShouldBe("user.email_taken");
        body.GetProperty("traceId").GetString().ShouldNotBeNullOrEmpty();
        body.TryGetProperty("errors", out _).ShouldBeFalse();
    }

    private static async Task<JsonElement> WriteAsync(ProblemHttpResult result)
    {
        ServiceCollection services = new();
        services.AddLogging();
        services.AddStandardProblemDetails();

        await using ServiceProvider provider = services.BuildServiceProvider();
        using MemoryStream body = new();
        DefaultHttpContext httpContext = new() { RequestServices = provider, Response = { Body = body } };

        await result.ExecuteAsync(httpContext);

        body.Position = 0;
        using JsonDocument document = await JsonDocument.ParseAsync(body, cancellationToken: TestContext.Current.CancellationToken);

        return document.RootElement.Clone();
    }
}
