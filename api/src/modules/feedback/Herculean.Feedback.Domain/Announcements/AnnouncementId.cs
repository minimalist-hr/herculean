using Herculean.SharedKernel.Entities;

namespace Herculean.Feedback.Domain.Announcements;

internal readonly record struct AnnouncementId(Guid Value) : ITypedId<AnnouncementId>
{
    public static AnnouncementId New() => new(Guid.CreateVersion7());

    public static AnnouncementId From(Guid value) => new(value);
}
