using Herculean.Feedback.Application.Announcements;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Feedback.Infrastructure.Announcements;

internal sealed class AnnouncementReadRepository(FeedbackDbContext dbContext) : IAnnouncementReadRepository
{
    public Task<AnnouncementResponse?> GetAsync(CancellationToken cancellationToken) =>
        dbContext.Announcements
            .AsNoTracking()
            .OrderByDescending(announcement => announcement.CreatedAtUtc)
            .Select(announcement => new AnnouncementResponse(announcement.Id.Value, announcement.Title, announcement.Text, announcement.CreatedAtUtc))
            .FirstOrDefaultAsync(cancellationToken);
}
