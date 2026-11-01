namespace Herculean.Account.Application.PasswordResets;

internal interface IPasswordResetQueue
{
    /// <summary>Asks for a reset email to go out later, so the request takes as long for every address.</summary>
    void Enqueue(string email);
}
