using Herculean.Feedback.Application.Blocks;
using Herculean.Feedback.Application.Blocks.BlockFeedback;
using Herculean.Feedback.Application.Blocks.GetFeedbackBlock;
using Herculean.Feedback.Application.Blocks.GetOwnFeedbackBlock;
using Herculean.Feedback.Application.Blocks.UnblockFeedback;
using Herculean.Feedback.Domain;
using Herculean.Feedback.Infrastructure.Blocks;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Feedback.UnitTests.Application.Blocks;

public sealed class BlockFeedbackHandlerTests : IDisposable
{
    private readonly FeedbackDatabase _database = new();

    [Fact]
    public async Task AUserIsBlockedOnce()
    {
        Guid ana = Guid.CreateVersion7();
        BlockFeedbackHandler handler = new(new FeedbackBlockRepository(_database.DbContext), _database.DbContext);

        (await handler.HandleAsync(ana, FeedbackDatabase.Token)).IsSuccess.ShouldBeTrue();
        (await handler.HandleAsync(ana, FeedbackDatabase.Token)).IsSuccess.ShouldBeTrue();

        (await _database.DbContext.FeedbackBlocks.IgnoreQueryFilters().ToListAsync(FeedbackDatabase.Token))
            .ShouldHaveSingleItem().UserId.ShouldBe(UserId.From(ana));
    }

    public void Dispose()
    {
        _database.Dispose();
    }
}

public sealed class UnblockFeedbackHandlerTests : IDisposable
{
    private readonly FeedbackDatabase _database = new();

    [Fact]
    public async Task AUserIsUnblocked()
    {
        UserId ana = UserId.From(Guid.CreateVersion7());
        await _database.BlockAsync(ana);
        UnblockFeedbackHandler handler = new(new FeedbackBlockRepository(_database.DbContext), _database.DbContext);

        (await handler.HandleAsync(ana.Value, FeedbackDatabase.Token)).IsSuccess.ShouldBeTrue();
        (await handler.HandleAsync(ana.Value, FeedbackDatabase.Token)).IsSuccess.ShouldBeTrue();

        (await _database.DbContext.FeedbackBlocks.IgnoreQueryFilters().ToListAsync(FeedbackDatabase.Token)).ShouldBeEmpty();
    }

    public void Dispose()
    {
        _database.Dispose();
    }
}

public sealed class GetFeedbackBlockHandlerTests : IDisposable
{
    private readonly FeedbackDatabase _database = new();

    [Fact]
    public async Task SaysWhetherAnyUserIsBlocked()
    {
        UserId ana = UserId.From(Guid.CreateVersion7());
        await _database.BlockAsync(ana);
        GetFeedbackBlockHandler handler = new(new FeedbackBlockRepository(_database.DbContext));

        (await handler.HandleAsync(ana.Value, FeedbackDatabase.Token)).Value.ShouldBe(new FeedbackBlockResponse(true));
        (await handler.HandleAsync(Guid.CreateVersion7(), FeedbackDatabase.Token)).Value.ShouldBe(new FeedbackBlockResponse(false));
    }

    public void Dispose()
    {
        _database.Dispose();
    }
}

public sealed class GetOwnFeedbackBlockHandlerTests : IDisposable
{
    private readonly FeedbackDatabase _database = new();

    [Fact]
    public async Task SaysWhetherYouAreBlocked()
    {
        GetOwnFeedbackBlockHandler handler = new(new FeedbackBlockRepository(_database.DbContext));
        await _database.BlockAsync(UserId.From(Guid.CreateVersion7()));

        (await handler.HandleAsync(FeedbackDatabase.Token)).Value.Blocked.ShouldBeFalse();
        await _database.BlockAsync();
        (await handler.HandleAsync(FeedbackDatabase.Token)).Value.Blocked.ShouldBeTrue();
    }

    public void Dispose()
    {
        _database.Dispose();
    }
}
