namespace Herculean.Feedback.Application.Announcements.GetAnnouncement;

internal sealed class GetAnnouncementHandler(IAnnouncementReadRepository announcementReadRepository)
{
    public async Task<CurrentAnnouncementResponse> HandleAsync(CancellationToken cancellationToken) =>
        new(await announcementReadRepository.GetAsync(cancellationToken));
}
