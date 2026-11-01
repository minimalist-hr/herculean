using Herculean.Account.Application.Auth;

using Microsoft.AspNetCore.Identity;

namespace Herculean.Account.Infrastructure.Auth;

internal sealed class PasswordHasher : IPasswordHasher
{
    // The ASP.NET Core hasher ignores the user it is given.
    private static readonly object NoUser = new();

    private readonly PasswordHasher<object> _aspNetCoreHasher = new();

    // A real hash to check against when there is no account, so that case takes as long as a wrong password.
    private readonly Lazy<string> _noAccountHash;

    public PasswordHasher()
    {
        _noAccountHash = new Lazy<string>(() => _aspNetCoreHasher.HashPassword(NoUser, "no account"));
    }

    public string Hash(string password) => _aspNetCoreHasher.HashPassword(NoUser, password);

    public PasswordVerification Verify(string? passwordHash, string password)
    {
        PasswordVerificationResult result = _aspNetCoreHasher.VerifyHashedPassword(NoUser, passwordHash ?? _noAccountHash.Value, password);

        return passwordHash is null
            ? PasswordVerification.Failed
            : result switch
            {
                PasswordVerificationResult.Success => PasswordVerification.Success,
                PasswordVerificationResult.SuccessRehashNeeded => PasswordVerification.SuccessRehashNeeded,
                _ => PasswordVerification.Failed,
            };
    }
}
