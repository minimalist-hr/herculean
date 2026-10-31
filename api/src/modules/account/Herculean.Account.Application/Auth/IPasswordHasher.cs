namespace Herculean.Account.Application.Auth;

internal interface IPasswordHasher
{
    string Hash(string password);
}
