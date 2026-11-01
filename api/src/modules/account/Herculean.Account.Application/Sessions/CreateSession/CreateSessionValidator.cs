using FluentValidation;

namespace Herculean.Account.Application.Sessions.CreateSession;

// Only checks that both are there. The account rules (email format, password length) are not repeated,
// so sign in never hints at them.
internal sealed class CreateSessionValidator : AbstractValidator<CreateSessionRequest>
{
    public CreateSessionValidator()
    {
        RuleFor(request => request.Email).NotEmpty();
        RuleFor(request => request.Password).NotEmpty();
    }
}
