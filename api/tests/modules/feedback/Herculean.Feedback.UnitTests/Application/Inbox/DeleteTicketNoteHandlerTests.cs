using Herculean.Feedback.Application.Inbox.DeleteTicketNote;
using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;
using Herculean.Feedback.Infrastructure.Tickets;
using Herculean.SharedKernel.Results;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Feedback.UnitTests.Application.Inbox;

public sealed class DeleteTicketNoteHandlerTests : IDisposable
{
    private readonly FeedbackDatabase _database = new();
    private readonly DeleteTicketNoteHandler _handler;

    public DeleteTicketNoteHandlerTests()
    {
        _handler = new DeleteTicketNoteHandler(new TicketNoteRepository(_database.DbContext), _database.DbContext);
    }

    [Fact]
    public async Task AnyUsersNoteIsDeleted()
    {
        Ticket ticket = await _database.SaveTicketAsync(userId: UserId.From(Guid.CreateVersion7()));
        TicketNote note = await _database.SaveNoteAsync(ticket, "Duplicate of the timer bug.");

        Result result = await _handler.HandleAsync(ticket.Id.Value, note.Id.Value, FeedbackDatabase.Token);

        result.IsSuccess.ShouldBeTrue();
        (await _database.DbContext.TicketNotes.IgnoreQueryFilters().ToListAsync(FeedbackDatabase.Token)).ShouldBeEmpty();
    }

    [Fact]
    public async Task ANoteOnAnotherTicketIsNotFound()
    {
        Ticket ticket = await _database.SaveTicketAsync();
        Ticket other = await _database.SaveTicketAsync();
        TicketNote note = await _database.SaveNoteAsync(other, "Elsewhere");

        Result result = await _handler.HandleAsync(ticket.Id.Value, note.Id.Value, FeedbackDatabase.Token);

        result.Error.ShouldBe(TicketErrors.NoteNotFound);
    }

    public void Dispose()
    {
        _database.Dispose();
    }
}
