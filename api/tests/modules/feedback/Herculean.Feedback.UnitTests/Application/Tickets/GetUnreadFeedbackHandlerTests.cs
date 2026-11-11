using Herculean.Feedback.Application.Tickets.GetUnreadFeedback;
using Herculean.Feedback.Domain;
using Herculean.Feedback.Infrastructure.Tickets;

namespace Herculean.Feedback.UnitTests.Application.Tickets;

public sealed class GetUnreadFeedbackHandlerTests : IDisposable
{
    private readonly FeedbackDatabase _database = new();
    private readonly GetUnreadFeedbackHandler _handler;

    public GetUnreadFeedbackHandlerTests()
    {
        _handler = new GetUnreadFeedbackHandler(new TicketReadRepository(_database.DbContext));
    }

    [Fact]
    public async Task CountsOnlyTheUsersTicketsWithAnUnreadReply()
    {
        await _database.SaveTicketAsync(hasUnreadReply: true);
        await _database.SaveTicketAsync(hasUnreadReply: true);
        await _database.SaveTicketAsync();
        await _database.SaveTicketAsync(userId: UserId.From(Guid.CreateVersion7()), hasUnreadReply: true);

        (await _handler.HandleAsync(FeedbackDatabase.Token)).Count.ShouldBe(2);
    }

    public void Dispose()
    {
        _database.Dispose();
    }
}
