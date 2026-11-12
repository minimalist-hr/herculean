using Herculean.Account.Contracts;
using Herculean.Feedback.Application.AccountDeleted;
using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;
using Herculean.Feedback.Infrastructure;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Feedback.UnitTests.Application.AccountDeleted;

public sealed class AccountDeletedIntegrationEventHandlerTests : IDisposable
{
    private readonly FeedbackDatabase _database = new();
    private readonly UserId _otherUserId = UserId.From(Guid.CreateVersion7());
    private readonly FeedbackDbContext _dbContext;
    private readonly AccountDeletedIntegrationEventHandler _handler;

    public AccountDeletedIntegrationEventHandlerTests()
    {
        _dbContext = _database.CreateDbContextWithNoUser();
        _handler = new AccountDeletedIntegrationEventHandler(new UserDataRepository(_dbContext), _dbContext);
    }

    [Fact]
    public async Task DeletesEveryTicketMessageAndScreenshotOfTheUserAndNothingElse()
    {
        Ticket ticket = await _database.SaveTicketAsync(screenshots: 2);
        await _database.SaveMessageAsync(ticket, MessageAuthor.Admin, "Thanks", DateTimeOffset.UnixEpoch.AddDays(1), screenshots: 1);
        await _database.SaveTicketAsync(userId: _otherUserId, screenshots: 1);

        await HandleAsync();

        (await _database.ListAllTicketsAsync()).ShouldAllBe(saved => saved.UserId == _otherUserId);
        (await _database.ListAllTicketsAsync()).ShouldHaveSingleItem();
        (await _dbContext.Set<TicketMessage>().IgnoreQueryFilters().Select(row => row.UserId).ToListAsync(FeedbackDatabase.Token)).ShouldBe([_otherUserId]);
        (await _dbContext.Set<Screenshot>().IgnoreQueryFilters().Select(row => row.UserId).ToListAsync(FeedbackDatabase.Token)).ShouldBe([_otherUserId]);
    }

    [Fact]
    public async Task DeletesTheUsersNotesAndBlockToo()
    {
        Ticket ticket = await _database.SaveTicketAsync();
        await _database.SaveNoteAsync(ticket, "Mine");
        await _database.SaveNoteAsync(await _database.SaveTicketAsync(userId: _otherUserId), "Theirs");
        await _database.BlockAsync();
        await _database.BlockAsync(_otherUserId);

        await HandleAsync();

        (await _dbContext.TicketNotes.IgnoreQueryFilters().Select(row => row.UserId).ToListAsync(FeedbackDatabase.Token)).ShouldBe([_otherUserId]);
        (await _dbContext.FeedbackBlocks.IgnoreQueryFilters().Select(row => row.UserId).ToListAsync(FeedbackDatabase.Token)).ShouldBe([_otherUserId]);
    }

    [Fact]
    public async Task TheEventSentTwiceChangesNothingMore()
    {
        await _database.SaveTicketAsync();

        await HandleAsync();
        await HandleAsync();

        (await _database.ListAllTicketsAsync()).ShouldBeEmpty();
    }

    public void Dispose()
    {
        _dbContext.Dispose();
        _database.Dispose();
    }

    private Task HandleAsync() =>
        _handler.HandleAsync(new AccountDeletedIntegrationEvent(_database.UserId.Value), FeedbackDatabase.Token);
}
