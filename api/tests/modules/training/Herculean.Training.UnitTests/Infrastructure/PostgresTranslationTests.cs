using Herculean.Training.Application.Auth;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Infrastructure;
using Herculean.Training.Infrastructure.Exercises;
using Herculean.Training.Infrastructure.Export;
using Herculean.Training.UnitTests.Application;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.UnitTests.Infrastructure;

/// <summary>
/// Reads that the in-memory database runs but Postgres might not. Each one runs against a server that isn't there:
/// a query Postgres can't run fails before connecting, so failing to connect means it translated.
/// </summary>
public sealed class PostgresTranslationTests
{
    private static CancellationToken Token => TestContext.Current.CancellationToken;

    [Fact]
    public Task BestSetsTranslate() =>
        ShouldTranslateAsync(dbContext => DoneSets.ListBestAsync(dbContext, [ExerciseId.New()], Token));

    [Fact]
    public Task WorkoutDatesTranslate() =>
        ShouldTranslateAsync(dbContext => DoneSets.ListWorkoutDatesAsync(dbContext, ExerciseId.New(), Token));

    [Fact]
    public Task SessionMonthsTranslate() =>
        ShouldTranslateAsync(dbContext => DoneSets.ListMonthsAsync(dbContext, ExerciseId.New(), new DateOnly(2026, 10, 1), new DateOnly(2026, 10, 31), Token));

    [Fact]
    public Task HeaviestSetsTranslate() =>
        ShouldTranslateAsync(dbContext => DoneSets.ListHeaviestPerSessionAsync(dbContext, ExerciseId.New(), new DateOnly(2026, 8, 1), Token));

    [Fact]
    public Task HeaviestSetsOfEveryExerciseTranslate() =>
        ShouldTranslateAsync(dbContext => DoneSets.ListHeaviestPerSessionAsync(dbContext, [ExerciseId.New()], Token));

    [Fact]
    public Task SessionsTranslate() =>
        ShouldTranslateAsync(dbContext => new ExerciseReadRepository(dbContext).ListSessionsAsync(ExerciseId.New(), new DateOnly(2026, 10, 16), 21, Token));

    [Fact]
    public Task TheExportTranslates() =>
        ShouldTranslateAsync(dbContext => new ExportReadRepository(dbContext).GetAsync(Token));

    private static async Task ShouldTranslateAsync(Func<TrainingDbContext, Task> read)
    {
        using TrainingDbContext dbContext = new(
            new DbContextOptionsBuilder<TrainingDbContext>()
                .UseNpgsql("Host=127.0.0.1;Port=1;Timeout=1;Database=none;Username=none;Password=none")
                .UseSnakeCaseNamingConvention()
                .Options,
            new CurrentUser(new FakeCurrentUserAccessor { UserId = Guid.CreateVersion7() }));

        Exception error = await Should.ThrowAsync<Exception>(() => read(dbContext));

        error.ToString().ShouldNotContain("could not be translated");
    }
}
