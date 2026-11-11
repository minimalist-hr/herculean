using Herculean.Feedback.Application.Tickets.MarkTicketRead;
using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;
using Herculean.Feedback.Infrastructure.Tickets;
using Herculean.SharedKernel.Results;

namespace Herculean.Feedback.UnitTests.Application.Tickets;

public sealed class MarkTicketReadHandlerTests : IDisposable
{
    private readonly FeedbackDatabase _database = new();
    private readonly MarkTicketReadHandler _handler;

    public MarkTicketReadHandlerTests()
    {
        _handler = new MarkTicketReadHandler(new TicketRepository(_database.DbContext), _database.DbContext);
    }

    [Fact]
    public async Task AnUnreadReplyIsRead()
    {
        Ticket ticket = await _database.SaveTicketAsync(status: TicketStatus.Answered, hasUnreadReply: true);

        Result result = await _handler.HandleAsync(ticket.Id.Value, FeedbackDatabase.Token);

        result.IsSuccess.ShouldBeTrue();
        Ticket saved = (await _database.ListAllTicketsAsync()).ShouldHaveSingleItem();
        saved.HasUnreadReply.ShouldBeFalse();
        saved.Status.ShouldBe(TicketStatus.Answered);
    }

    [Fact]
    public async Task AnotherUsersTicketIsNotFound()
    {
        Ticket ticket = await _database.SaveTicketAsync(userId: UserId.From(Guid.CreateVersion7()), hasUnreadReply: true);

        (await _handler.HandleAsync(ticket.Id.Value, FeedbackDatabase.Token)).Error.ShouldBe(TicketErrors.NotFound);
        (await _database.ListAllTicketsAsync()).ShouldHaveSingleItem().HasUnreadReply.ShouldBeTrue();
    }

    public void Dispose()
    {
        _database.Dispose();
    }
}
