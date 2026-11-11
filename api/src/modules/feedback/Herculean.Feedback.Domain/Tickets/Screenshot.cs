using Herculean.SharedKernel.Entities;

namespace Herculean.Feedback.Domain.Tickets;

/// <summary>A JPEG on a message, in its own table so that reading a thread doesn't load it.</summary>
internal sealed class Screenshot : Entity<ScreenshotId>
{
    private Screenshot(ScreenshotId id, UserId userId, TicketMessageId messageId, int order, byte[] image) : base(id)
    {
        UserId = userId;
        MessageId = messageId;
        Order = order;
        Image = image;
    }

    public UserId UserId { get; private set; }

    public TicketMessageId MessageId { get; private set; }

    public int Order { get; private set; }

    public byte[] Image { get; private set; }

    internal static Screenshot Create(UserId userId, TicketMessageId messageId, int order, byte[] image) => new(ScreenshotId.New(), userId, messageId, order, image);
}
