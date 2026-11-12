namespace Herculean.Feedback.Domain.Announcements;

internal interface IAnnouncementRepository
{
    /// <summary>Every announcement saved, which is one at most.</summary>
    Task<List<Announcement>> ListAsync(CancellationToken cancellationToken);

    void Add(Announcement announcement);

    void Remove(Announcement announcement);
}
