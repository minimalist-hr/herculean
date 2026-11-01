namespace Herculean.Account.Application.Auth;

internal interface IPasswordHasher
{
    string Hash(string password);

    /// <summary>
    /// Checks a password against its hash. Without a hash (no such account) it still takes as long,
    /// so the time to answer never tells which emails have an account.
    /// </summary>
    PasswordVerification Verify(string? passwordHash, string password);
}

internal enum PasswordVerification
{
    Failed,
    Success,

    /// <summary>Right, but hashed with older settings: hash it again and save it.</summary>
    SuccessRehashNeeded,
}
