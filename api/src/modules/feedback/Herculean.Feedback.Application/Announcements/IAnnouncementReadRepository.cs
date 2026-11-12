namespace Herculean.Feedback.Application.Announcements;

internal interface IAnnouncementReadRepository
{
    /// <summary>The announcement, or null when there is none.</summary>
    Task<AnnouncementResponse?> GetAsync(CancellationToken cancellationToken);
}
