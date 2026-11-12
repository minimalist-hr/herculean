using Herculean.Account.Contracts;
using Herculean.Feedback.Application.Inbox.GetInboxTicket;
using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;
using Herculean.Feedback.Infrastructure.Inbox;
using Herculean.SharedKernel.Results;

namespace Herculean.Feedback.UnitTests.Application.Inbox;

public sealed class GetInboxTicketHandlerTests : IDisposable
{
    private static readonly DateTimeOffset Monday = new(2026, 11, 9, 9, 0, 0, TimeSpan.Zero);
    private readonly FeedbackDatabase _database = new();
    private readonly UserId _ana = UserId.From(Guid.CreateVersion7());
    private readonly GetInboxTicketHandler _handler;

    public GetInboxTicketHandlerTests()
    {
        _handler = new GetInboxTicketHandler(
            new InboxReadRepository(_database.DbContext),
            new FakeUserContacts(new UserContact(_ana.Value, "Ana", "ana@example.com")));
    }

    [Fact]
    public async Task AnyUsersTicketComesWithItsSenderDeviceAndThread()
    {
        Ticket ticket = await _database.SaveTicketAsync(userId: _ana, message: "The timer stops.", createdAtUtc: Monday, screenshots: 1);
        await _database.SaveMessageAsync(ticket, MessageAuthor.Admin, "Which phone?", Monday.AddHours(1));

        InboxTicketResponse found = (await _handler.HandleAsync(ticket.Id.Value, FeedbackDatabase.Token)).Value;

        found.SenderId.ShouldBe(_ana.Value);
        found.SenderName.ShouldBe("Ana");
        found.SenderEmail.ShouldBe("ana@example.com");
        found.AppVersion.ShouldBe(FeedbackDatabase.Device.AppVersion);
        found.Phone.ShouldBe(FeedbackDatabase.Device.Phone);
        found.Os.ShouldBe(FeedbackDatabase.Device.Os);
        found.Messages.Select(message => message.Text).ShouldBe(["The timer stops.", "Which phone?"]);
        found.Messages[0].ScreenshotIds.ShouldHaveSingleItem();
    }

    [Fact]
    public async Task AMissingTicketIsNotFound()
    {
        Result<InboxTicketResponse> result = await _handler.HandleAsync(Guid.CreateVersion7(), FeedbackDatabase.Token);

        result.Error.ShouldBe(TicketErrors.NotFound);
    }

    public void Dispose()
    {
        _database.Dispose();
    }
}
