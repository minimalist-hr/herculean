using Herculean.Account.Infrastructure;
using Herculean.Account.Infrastructure.Users;
using Herculean.SharedKernel.Events;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Account.UnitTests.Infrastructure;

/// <summary>
/// Reads and bulk deletes that the in-memory database can't run or that Postgres might not. Each one runs against a server that isn't there:
/// a query Postgres can't run fails before connecting, so failing to connect means it translated.
/// </summary>
public sealed class PostgresTranslationTests
{
    private static CancellationToken Token => TestContext.Current.CancellationToken;

    [Fact]
    public Task ASearchTranslates() =>
        ShouldTranslateAsync(dbContext => new UserReadRepository(dbContext).ListUsersAsync("50%_ana", false, DateTimeOffset.UnixEpoch, 21, Token));

    [Fact]
    public Task DeletingSoonTranslates() =>
        ShouldTranslateAsync(dbContext => new UserReadRepository(dbContext).ListUsersAsync(null, true, DateTimeOffset.UnixEpoch, 21, Token));

    [Fact]
    public Task DeletingExpiredTokensTranslates() =>
        ShouldTranslateAsync(dbContext => new UserRepository(dbContext).DeleteExpiredTokensAsync(DateTimeOffset.UnixEpoch, Token));

    [Fact]
    public Task DeletingSentOutboxMessagesTranslates() =>
        ShouldTranslateAsync(dbContext => new Outbox(dbContext, TimeProvider.System).DeleteSentAsync(Token));

    private static async Task ShouldTranslateAsync(Func<AccountDbContext, Task> read)
    {
        using AccountDbContext dbContext = new(
            new DbContextOptionsBuilder<AccountDbContext>()
                .UseNpgsql("Host=127.0.0.1;Port=1;Timeout=1;Database=none;Username=none;Password=none")
                .UseSnakeCaseNamingConvention()
                .Options,
            new OutboxSignal<AccountDbContext>());

        Exception error = await Should.ThrowAsync<Exception>(() => read(dbContext));

        error.ToString().ShouldNotContain("could not be translated");
    }
}
