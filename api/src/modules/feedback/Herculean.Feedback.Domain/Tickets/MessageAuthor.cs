using System.ComponentModel;

namespace Herculean.Feedback.Domain.Tickets;

[Description("Who wrote a message: the user, or Minimalist.")]
internal enum MessageAuthor
{
    User,
    Admin,
}
