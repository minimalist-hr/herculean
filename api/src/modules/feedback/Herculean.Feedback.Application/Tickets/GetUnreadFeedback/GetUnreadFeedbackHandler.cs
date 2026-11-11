namespace Herculean.Feedback.Application.Tickets.GetUnreadFeedback;

internal sealed class GetUnreadFeedbackHandler(ITicketReadRepository ticketReadRepository)
{
    public async Task<UnreadFeedbackResponse> HandleAsync(CancellationToken cancellationToken) =>
        new(await ticketReadRepository.CountUnreadAsync(cancellationToken));
}
