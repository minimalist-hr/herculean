using System.Net;
using System.Text.Json;

using Herculean.SharedKernel.Persistence;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using Npgsql;

namespace Herculean.SharedKernel.UnitTests.Persistence;

public sealed class UniqueIndexErrorsTests
{
    private static readonly Error Taken = Error.Conflict("thing.taken", "That thing is taken.");

    private static PostgresException Violation(string sqlState, string indexName) =>
        new("failed", "ERROR", "ERROR", sqlState, constraintName: indexName);

    [Fact]
    public async Task ARegisteredIndexAnswersWithItsError()
    {
        using HttpResponseMessage response = await SendAsync(new DbUpdateException("failed", Violation(PostgresErrorCodes.UniqueViolation, "ix_things_name")));

        response.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        using JsonDocument problem = JsonDocument.Parse(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        problem.RootElement.GetProperty("code").GetString().ShouldBe("thing.taken");
        problem.RootElement.GetProperty("detail").GetString().ShouldBe("That thing is taken.");
    }

    [Fact]
    public async Task AnotherIndexIsStillABug()
    {
        using HttpResponseMessage response = await SendAsync(new DbUpdateException("failed", Violation(PostgresErrorCodes.UniqueViolation, "ix_other")));

        response.StatusCode.ShouldBe(HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task AnotherDatabaseFailureIsStillABug()
    {
        using HttpResponseMessage response = await SendAsync(new DbUpdateException("failed", Violation(PostgresErrorCodes.ForeignKeyViolation, "ix_things_name")));

        response.StatusCode.ShouldBe(HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task AnyOtherExceptionIsStillABug()
    {
        using HttpResponseMessage response = await SendAsync(new InvalidOperationException("failed"));

        response.StatusCode.ShouldBe(HttpStatusCode.InternalServerError);
    }

    private static async Task<HttpResponseMessage> SendAsync(Exception exception)
    {
        WebApplicationBuilder builder = WebApplication.CreateSlimBuilder();
        builder.WebHost.UseTestServer();
        builder.Services.AddRouting();
        builder.Services.AddStandardProblemDetails();
        builder.Services.AddUniqueIndexError("ix_things_name", Taken);
        await using WebApplication app = builder.Build();
        app.UseExceptionHandler();
        app.MapPost("/things", void () => throw exception);
        await app.StartAsync(TestContext.Current.CancellationToken);
        using HttpClient client = app.GetTestClient();

        HttpResponseMessage response = await client.PostAsync(new Uri("/things", UriKind.Relative), null, TestContext.Current.CancellationToken);
        await response.Content.LoadIntoBufferAsync(TestContext.Current.CancellationToken);
        await app.StopAsync(TestContext.Current.CancellationToken);

        return response;
    }
}
