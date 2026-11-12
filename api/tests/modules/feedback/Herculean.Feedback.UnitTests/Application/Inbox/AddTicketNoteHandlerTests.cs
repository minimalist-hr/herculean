using Herculean.Feedback.Application.Inbox.AddTicketNote;
using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;
using Herculean.Feedback.Infrastructure.Tickets;
using Herculean.SharedKernel.Results;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Feedback.UnitTests.Application.Inbox;

public sealed class AddTicketNoteHandlerTests : IDisposable
{
    private readonly FeedbackDatabase _database = new();
    private readonly AddTicketNoteHandler _handler;

    public AddTicketNoteHandlerTests()
    {
        _handler = new AddTicketNoteHandler(new AddTicketNoteValidator(), new TicketRepository(_database.DbContext), new TicketNoteRepository(_database.DbContext), _database.DbContext);
    }

    [Fact]
    public async Task ANoteIsSavedTrimmedForTheTicketsUser()
    {
        UserId ana = UserId.From(Guid.CreateVersion7());
        Ticket ticket = await _database.SaveTicketAsync(userId: ana);

        Result result = await _handler.HandleAsync(ticket.Id.Value, new AddTicketNoteRequest(" Asked on Discord too. "), FeedbackDatabase.Token);

        result.IsSuccess.ShouldBeTrue();
        TicketNote note = (await _database.DbContext.TicketNotes.IgnoreQueryFilters().ToListAsync(FeedbackDatabase.Token)).ShouldHaveSingleItem();
        note.Text.ShouldBe("Asked on Discord too.");
        note.UserId.ShouldBe(ana);
        note.TicketId.ShouldBe(ticket.Id);
    }

    [Theory]
    [InlineData(" ", "Write a note.")]
    [InlineData(null, "Write a note.")]
    public async Task AnEmptyNoteIsNotValid(string? text, string error)
    {
        Ticket ticket = await _database.SaveTicketAsync();

        Result result = await _handler.HandleAsync(ticket.Id.Value, new AddTicketNoteRequest(text!), FeedbackDatabase.Token);

        result.Error.ShouldNotBeNull().Fields["text"].ShouldBe([error]);
    }

    [Fact]
    public async Task ATooLongNoteIsNotValid()
    {
        Ticket ticket = await _database.SaveTicketAsync();

        Result result = await _handler.HandleAsync(ticket.Id.Value, new AddTicketNoteRequest(new string('a', TicketNote.TextMaxLength + 1)), FeedbackDatabase.Token);

        result.Error.ShouldNotBeNull().Fields["text"].ShouldBe(["A note has at most 2,000 characters."]);
    }

    [Fact]
    public async Task AMissingTicketIsNotFound()
    {
        Result result = await _handler.HandleAsync(Guid.CreateVersion7(), new AddTicketNoteRequest("Hi"), FeedbackDatabase.Token);

        result.Error.ShouldBe(TicketErrors.NotFound);
    }

    public void Dispose()
    {
        _database.Dispose();
    }
}
