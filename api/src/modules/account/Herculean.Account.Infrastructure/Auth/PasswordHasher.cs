using Herculean.Account.Application.Auth;

using Microsoft.AspNetCore.Identity;

namespace Herculean.Account.Infrastructure.Auth;

internal sealed class PasswordHasher : IPasswordHasher
{
    // The ASP.NET Core hasher ignores the user it is given.
    private static readonly object NoUser = new();

    private readonly PasswordHasher<object> _aspNetCoreHasher = new();

    public string Hash(string password) => _aspNetCoreHasher.HashPassword(NoUser, password);
}
