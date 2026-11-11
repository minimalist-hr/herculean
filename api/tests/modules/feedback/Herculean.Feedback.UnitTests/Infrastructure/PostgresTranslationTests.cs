using Herculean.Feedback.Application.Auth;
using Herculean.Feedback.Domain.Tickets;
using Herculean.Feedback.Infrastructure;
using Herculean.Feedback.Infrastructure.Tickets;
using Herculean.SharedKernel.Auth;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Feedback.UnitTests.Infrastructure;

/// <summary>
/// Reads that the in-memory database runs but Postgres might not. Each one runs against a server that isn't there:
/// a query Postgres can't run fails before connecting, so failing to connect means it translated.
/// </summary>
public sealed class PostgresTranslationTests
{
    private static CancellationToken Token => TestContext.Current.CancellationToken;

    [Fact]
    public Task TheListTranslates() =>
        ShouldTranslateAsync(dbContext => new TicketReadRepository(dbContext).ListAsync(Token));

    [Fact]
    public Task AThreadTranslates() =>
        ShouldTranslateAsync(dbContext => new TicketReadRepository(dbContext).GetAsync(TicketId.New(), Token));

    [Fact]
    public Task AScreenshotTranslates() =>
        ShouldTranslateAsync(dbContext => new TicketReadRepository(dbContext).GetScreenshotAsync(TicketId.New(), ScreenshotId.New(), Token));

    [Fact]
    public Task TheExportTranslates() =>
        ShouldTranslateAsync(dbContext => new TicketReadRepository(dbContext).ExportAsync(Token));

    [Fact]
    public Task TheDailyCountTranslates() =>
        ShouldTranslateAsync(dbContext => new TicketRepository(dbContext).CountCreatedSinceAsync(DateTimeOffset.UnixEpoch, Token));

    private static async Task ShouldTranslateAsync(Func<FeedbackDbContext, Task> read)
    {
        using FeedbackDbContext dbContext = new(
            new DbContextOptionsBuilder<FeedbackDbContext>()
                .UseNpgsql("Host=127.0.0.1;Port=1;Timeout=1;Database=none;Username=none;Password=none")
                .UseSnakeCaseNamingConvention()
                .Options,
            new CurrentUser(new FakeCurrentUserAccessor()));

        Exception error = await Should.ThrowAsync<Exception>(() => read(dbContext));

        error.ToString().ShouldNotContain("could not be translated");
    }

    private sealed class FakeCurrentUserAccessor : ICurrentUserAccessor
    {
        public Guid UserId { get; } = Guid.CreateVersion7();
    }
}
