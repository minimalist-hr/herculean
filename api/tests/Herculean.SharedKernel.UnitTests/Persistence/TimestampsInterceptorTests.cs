using Herculean.SharedKernel.Persistence;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Time.Testing;

namespace Herculean.SharedKernel.UnitTests.Persistence;

public sealed class TimestampsInterceptorTests : IDisposable
{
    private static readonly DateTimeOffset Created = new(2026, 10, 23, 18, 0, 0, TimeSpan.Zero);
    private static readonly DateTimeOffset Updated = Created.AddHours(1);

    private readonly FakeTimeProvider _time = new(Created);
    private readonly TestDbContext _dbContext;

    public TimestampsInterceptorTests()
    {
        DbContextOptions<TestDbContext> options = new DbContextOptionsBuilder<TestDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .AddInterceptors(new TimestampsInterceptor(_time))
            .Options;

        _dbContext = new TestDbContext(options);
    }

    [Fact]
    public async Task NewEntityGetsCreatedAndUpdatedTime()
    {
        TestEntity entity = new(TestId.New(), "Push");
        _dbContext.Add(entity);

        await _dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);

        entity.CreatedAtUtc.ShouldBe(Created);
        entity.UpdatedAtUtc.ShouldBe(Created);
    }

    [Fact]
    public void NewEntityGetsTimesOnSyncSaveToo()
    {
        TestEntity entity = new(TestId.New(), "Push");
        _dbContext.Add(entity);

        _dbContext.SaveChanges();

        entity.CreatedAtUtc.ShouldBe(Created);
        entity.UpdatedAtUtc.ShouldBe(Created);
    }

    [Fact]
    public async Task ChangedEntityGetsUpdatedTimeOnly()
    {
        TestEntity entity = new(TestId.New(), "Push");
        _dbContext.Add(entity);
        await _dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);

        _time.SetUtcNow(Updated);
        entity.Rename("Pull");
        await _dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);

        entity.CreatedAtUtc.ShouldBe(Created);
        entity.UpdatedAtUtc.ShouldBe(Updated);
    }

    public void Dispose()
    {
        _dbContext.Dispose();
    }
}
