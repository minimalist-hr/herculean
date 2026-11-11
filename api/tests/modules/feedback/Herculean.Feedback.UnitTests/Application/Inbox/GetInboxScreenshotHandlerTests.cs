using Herculean.Feedback.Application.Inbox.GetInboxScreenshot;
using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;
using Herculean.Feedback.Infrastructure.Inbox;

namespace Herculean.Feedback.UnitTests.Application.Inbox;

public sealed class GetInboxScreenshotHandlerTests : IDisposable
{
    private readonly FeedbackDatabase _database = new();
    private readonly GetInboxScreenshotHandler _handler;

    public GetInboxScreenshotHandlerTests()
    {
        _handler = new GetInboxScreenshotHandler(new InboxReadRepository(_database.DbContext));
    }

    [Fact]
    public async Task AnyUsersScreenshotComesAsBase64()
    {
        Ticket ticket = await _database.SaveTicketAsync(userId: UserId.From(Guid.CreateVersion7()), screenshots: 1);

        (await _handler.HandleAsync(ticket.Id.Value, ScreenshotOf(ticket), FeedbackDatabase.Token)).Value.Image
            .ShouldBe(Convert.ToBase64String(FeedbackDatabase.Jpeg));
    }

    [Fact]
    public async Task AScreenshotOfAnotherTicketIsNotFound()
    {
        Ticket ticket = await _database.SaveTicketAsync(screenshots: 1);
        Ticket other = await _database.SaveTicketAsync();

        (await _handler.HandleAsync(other.Id.Value, ScreenshotOf(ticket), FeedbackDatabase.Token)).Error.ShouldBe(TicketErrors.ScreenshotNotFound);
    }

    public void Dispose()
    {
        _database.Dispose();
    }

    private static Guid ScreenshotOf(Ticket ticket) => ticket.Messages[0].Screenshots[0].Id.Value;
}
