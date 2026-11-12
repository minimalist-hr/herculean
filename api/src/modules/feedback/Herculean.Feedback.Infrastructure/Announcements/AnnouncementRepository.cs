using Herculean.Feedback.Domain.Announcements;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Feedback.Infrastructure.Announcements;

internal sealed class AnnouncementRepository(FeedbackDbContext dbContext) : IAnnouncementRepository
{
    public Task<List<Announcement>> ListAsync(CancellationToken cancellationToken) =>
        dbContext.Announcements.ToListAsync(cancellationToken);

    public void Add(Announcement announcement)
    {
        dbContext.Announcements.Add(announcement);
    }

    public void Remove(Announcement announcement)
    {
        dbContext.Announcements.Remove(announcement);
    }
}
