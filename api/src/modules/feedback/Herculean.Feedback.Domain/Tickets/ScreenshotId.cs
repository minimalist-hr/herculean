using Herculean.SharedKernel.Entities;

namespace Herculean.Feedback.Domain.Tickets;

internal readonly record struct ScreenshotId(Guid Value) : ITypedId<ScreenshotId>
{
    public static ScreenshotId New() => new(Guid.CreateVersion7());

    public static ScreenshotId From(Guid value) => new(value);
}
