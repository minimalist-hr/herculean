using Herculean.Feedback.Application.Inbox.GetFeedbackStats;
using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;
using Herculean.Feedback.Infrastructure.Inbox;

namespace Herculean.Feedback.UnitTests.Application.Inbox;

public sealed class GetFeedbackStatsHandlerTests : IDisposable
{
    private static readonly DateTimeOffset Monday = new(2026, 11, 9, 9, 0, 0, TimeSpan.Zero);
    private readonly FeedbackDatabase _database = new();

    [Fact]
    public async Task CountsOpenTicketsWhoseLastMessageIsTheUsers()
    {
        await _database.SaveTicketAsync(userId: UserId.From(Guid.CreateVersion7()), createdAtUtc: Monday);
        Ticket answered = await _database.SaveTicketAsync(createdAtUtc: Monday, status: TicketStatus.Answered);
        await _database.SaveMessageAsync(answered, MessageAuthor.Admin, "Thanks", Monday.AddHours(1));
        await _database.SaveTicketAsync(createdAtUtc: Monday, status: TicketStatus.Closed);

        FeedbackStatsResponse stats = await new GetFeedbackStatsHandler(new InboxReadRepository(_database.DbContext)).HandleAsync(FeedbackDatabase.Token);

        stats.WaitingForReply.ShouldBe(1);
        stats.HighWaitingForReply.ShouldBe(0);
    }

    [Fact]
    public async Task CountsHighTicketsWaiting()
    {
        Ticket high = await _database.SaveTicketAsync(createdAtUtc: Monday);
        await SetPriorityAsync(high, TicketPriority.High);
        await _database.SaveTicketAsync(createdAtUtc: Monday);

        FeedbackStatsResponse stats = await new GetFeedbackStatsHandler(new InboxReadRepository(_database.DbContext)).HandleAsync(FeedbackDatabase.Token);

        stats.WaitingForReply.ShouldBe(2);
        stats.HighWaitingForReply.ShouldBe(1);
    }

    private async Task SetPriorityAsync(Ticket ticket, TicketPriority priority)
    {
        _database.DbContext.Attach(ticket);
        ticket.ChangePriority(priority);
        await _database.DbContext.SaveChangesAsync(FeedbackDatabase.Token);
        _database.DbContext.ChangeTracker.Clear();
    }

    public void Dispose()
    {
        _database.Dispose();
    }
}
