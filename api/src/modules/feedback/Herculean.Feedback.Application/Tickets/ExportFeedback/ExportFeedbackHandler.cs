namespace Herculean.Feedback.Application.Tickets.ExportFeedback;

internal sealed class ExportFeedbackHandler(ITicketReadRepository ticketReadRepository)
{
    public Task<FeedbackExportResponse> HandleAsync(CancellationToken cancellationToken) =>
        ticketReadRepository.ExportAsync(cancellationToken);
}
