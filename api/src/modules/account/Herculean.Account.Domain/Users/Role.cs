using System.ComponentModel;

namespace Herculean.Account.Domain.Users;

[Description("What an account is for: a user trains, and an admin only manages feedback.")]
internal enum Role
{
    User,
    Admin,
}
