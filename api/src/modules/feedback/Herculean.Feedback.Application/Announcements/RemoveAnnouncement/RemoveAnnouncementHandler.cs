using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Announcements;

namespace Herculean.Feedback.Application.Announcements.RemoveAnnouncement;

internal sealed class RemoveAnnouncementHandler(IAnnouncementRepository announcementRepository, IUnitOfWork unitOfWork)
{
    public async Task HandleAsync(CancellationToken cancellationToken)
    {
        foreach (Announcement announcement in await announcementRepository.ListAsync(cancellationToken))
        {
            announcementRepository.Remove(announcement);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
