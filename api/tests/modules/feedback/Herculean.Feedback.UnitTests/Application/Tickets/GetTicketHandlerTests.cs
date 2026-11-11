using Herculean.Feedback.Application.Tickets.GetTicket;
using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;
using Herculean.Feedback.Infrastructure.Tickets;
using Herculean.SharedKernel.Results;

namespace Herculean.Feedback.UnitTests.Application.Tickets;

public sealed class GetTicketHandlerTests : IDisposable
{
    private static readonly DateTimeOffset Monday = new(2026, 11, 9, 9, 0, 0, TimeSpan.Zero);
    private readonly FeedbackDatabase _database = new();
    private readonly GetTicketHandler _handler;

    public GetTicketHandlerTests()
    {
        _handler = new GetTicketHandler(new TicketReadRepository(_database.DbContext));
    }

    [Fact]
    public async Task TheThreadIsOldestFirstWithItsScreenshots()
    {
        Ticket ticket = await _database.SaveTicketAsync(message: "The timer stops.", createdAtUtc: Monday, screenshots: 2);
        await _database.SaveMessageAsync(ticket, MessageAuthor.Admin, "Which phone?", Monday.AddHours(1));

        Result<TicketResponse> result = await _handler.HandleAsync(ticket.Id.Value, FeedbackDatabase.Token);

        TicketResponse found = result.Value;
        found.Id.ShouldBe(ticket.Id.Value);
        found.Status.ShouldBe(TicketStatus.Open);
        found.HasUnreadReply.ShouldBeFalse();
        found.Messages.Select(message => message.Text).ShouldBe(["The timer stops.", "Which phone?"]);
        found.Messages.Select(message => message.Author).ShouldBe([MessageAuthor.User, MessageAuthor.Admin]);
        found.Messages[0].SentAtUtc.ShouldBe(Monday);
        found.Messages[0].ScreenshotIds.ShouldBe([.. ticket.Messages[0].Screenshots.Select(screenshot => screenshot.Id.Value)]);
        found.Messages[1].ScreenshotIds.ShouldBeEmpty();
    }

    [Fact]
    public async Task AnUnreadReplyShows()
    {
        Ticket ticket = await _database.SaveTicketAsync(status: TicketStatus.Answered, hasUnreadReply: true);

        (await _handler.HandleAsync(ticket.Id.Value, FeedbackDatabase.Token)).Value.HasUnreadReply.ShouldBeTrue();
    }

    [Fact]
    public async Task AMissingTicketIsNotFound()
    {
        (await _handler.HandleAsync(Guid.CreateVersion7(), FeedbackDatabase.Token)).Error.ShouldBe(TicketErrors.NotFound);
    }

    [Fact]
    public async Task AnotherUsersTicketIsNotFound()
    {
        Ticket ticket = await _database.SaveTicketAsync(userId: UserId.From(Guid.CreateVersion7()));

        (await _handler.HandleAsync(ticket.Id.Value, FeedbackDatabase.Token)).Error.ShouldBe(TicketErrors.NotFound);
    }

    public void Dispose()
    {
        _database.Dispose();
    }
}
