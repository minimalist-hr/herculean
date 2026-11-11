using Herculean.Feedback.Application.Tickets.ExportFeedback;
using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;
using Herculean.Feedback.Infrastructure.Tickets;

namespace Herculean.Feedback.UnitTests.Application.Tickets;

public sealed class ExportFeedbackHandlerTests : IDisposable
{
    private static readonly DateTimeOffset Monday = new(2026, 11, 9, 9, 0, 0, TimeSpan.Zero);
    private readonly FeedbackDatabase _database = new();
    private readonly ExportFeedbackHandler _handler;

    public ExportFeedbackHandlerTests()
    {
        _handler = new ExportFeedbackHandler(new TicketReadRepository(_database.DbContext));
    }

    [Fact]
    public async Task EveryTicketComesOldestFirstWithItsMessagesAndScreenshots()
    {
        Ticket newer = await _database.SaveTicketAsync(message: "Second", createdAtUtc: Monday.AddDays(1));
        Ticket older = await _database.SaveTicketAsync(message: "First", createdAtUtc: Monday, screenshots: 2);
        await _database.SaveMessageAsync(older, MessageAuthor.Admin, "Thanks", Monday.AddHours(1));
        await _database.SaveTicketAsync(userId: UserId.From(Guid.CreateVersion7()));

        FeedbackExportResponse export = await _handler.HandleAsync(FeedbackDatabase.Token);

        export.Tickets.Select(ticket => ticket.Messages[0].Text).ShouldBe(["First", "Second"]);
        TicketExportResponse first = export.Tickets[0];
        first.Type.ShouldBe(TicketType.Bug);
        first.Phone.ShouldBe(FeedbackDatabase.Device.Phone);
        first.Messages.Select(message => message.Author).ShouldBe([MessageAuthor.User, MessageAuthor.Admin]);
        first.Messages[0].SentAtUtc.ShouldBe(Monday);
        first.Messages[0].Screenshots.ShouldBe([Convert.ToBase64String(FeedbackDatabase.Jpeg), Convert.ToBase64String(FeedbackDatabase.Jpeg)]);
        first.Messages[1].Screenshots.ShouldBeEmpty();
        newer.Id.ShouldNotBe(older.Id);
    }

    [Fact]
    public async Task NoFeedbackIsAnEmptyExport()
    {
        (await _handler.HandleAsync(FeedbackDatabase.Token)).Tickets.ShouldBeEmpty();
    }

    public void Dispose()
    {
        _database.Dispose();
    }
}
