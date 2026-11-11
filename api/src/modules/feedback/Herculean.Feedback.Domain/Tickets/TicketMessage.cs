using Herculean.SharedKernel.Entities;

namespace Herculean.Feedback.Domain.Tickets;

/// <summary>A message in a ticket's thread. It is sent when it is created.</summary>
internal sealed class TicketMessage : Entity<TicketMessageId>
{
    private readonly List<Screenshot> _screenshots = [];

    private TicketMessage(TicketMessageId id, UserId userId, TicketId ticketId, MessageAuthor author, string text) : base(id)
    {
        UserId = userId;
        TicketId = ticketId;
        Author = author;
        Text = text;
    }

    /// <summary>The ticket's user, on Minimalist's replies too, so that their filter and deletion reach every message.</summary>
    public UserId UserId { get; private set; }

    public TicketId TicketId { get; private set; }

    public MessageAuthor Author { get; private set; }

    public string Text { get; private set; }

    public IReadOnlyList<Screenshot> Screenshots => _screenshots;

    internal static TicketMessage Create(UserId userId, TicketId ticketId, MessageAuthor author, string text, IEnumerable<byte[]> screenshots)
    {
        TicketMessage message = new(TicketMessageId.New(), userId, ticketId, author, text.Trim());
        message._screenshots.AddRange(screenshots.Select((image, order) => Screenshot.Create(userId, message.Id, order, image)));

        return message;
    }
}
