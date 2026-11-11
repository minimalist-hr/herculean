using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;

namespace Herculean.Feedback.UnitTests.Domain;

public sealed class TicketTests
{
    private readonly UserId _userId = UserId.From(Guid.CreateVersion7());

    [Fact]
    public void ANewTicketIsOpenWithTheUsersFirstMessage()
    {
        Ticket ticket = Ticket.Create(_userId, TicketType.Suggestion, "  Add a dark timer.  ", [FeedbackDatabase.Jpeg, FeedbackDatabase.Jpeg], new DeviceInfo(" 1.0.0 ", "  ", " iOS 18 "));

        ticket.Status.ShouldBe(TicketStatus.Open);
        ticket.Type.ShouldBe(TicketType.Suggestion);
        ticket.HasUnreadReply.ShouldBeFalse();
        ticket.AppVersion.ShouldBe("1.0.0");
        ticket.Phone.ShouldBeNull();
        ticket.Os.ShouldBe("iOS 18");
        TicketMessage message = ticket.Messages.ShouldHaveSingleItem();
        message.Author.ShouldBe(MessageAuthor.User);
        message.Text.ShouldBe("Add a dark timer.");
        message.UserId.ShouldBe(_userId);
        message.Screenshots.Select(screenshot => screenshot.Order).ShouldBe([0, 1]);
        message.Screenshots.ShouldAllBe(screenshot => screenshot.UserId == _userId && screenshot.MessageId == message.Id);
    }

    [Fact]
    public void ARepliedTicketWaitsForMinimalistAgain()
    {
        Ticket ticket = Ticket.Create(_userId, TicketType.Bug, "The timer stops.", [], FeedbackDatabase.Device);

        ticket.ReplyAsUser("Still stops.", []);

        ticket.Status.ShouldBe(TicketStatus.Open);
        ticket.Messages.Select(message => message.Text).ShouldBe(["The timer stops.", "Still stops."]);
        ticket.IsClosed.ShouldBeFalse();
    }
}
