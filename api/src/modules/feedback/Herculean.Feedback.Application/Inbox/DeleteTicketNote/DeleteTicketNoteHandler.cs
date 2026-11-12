using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;
using Herculean.SharedKernel.Results;

namespace Herculean.Feedback.Application.Inbox.DeleteTicketNote;

internal sealed class DeleteTicketNoteHandler(ITicketNoteRepository noteRepository, IUnitOfWork unitOfWork)
{
    public async Task<Result> HandleAsync(Guid id, Guid noteId, CancellationToken cancellationToken)
    {
        TicketNote? note = await noteRepository.GetAsync(TicketId.From(id), TicketNoteId.From(noteId), cancellationToken);
        if (note is null)
        {
            return TicketErrors.NoteNotFound;
        }

        noteRepository.Remove(note);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
