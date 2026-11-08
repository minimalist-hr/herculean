using FluentValidation;

using Herculean.Account.Application.Users.CreateUser;

namespace Herculean.Account.Application.EmailChanges.RequestEmailChange;

internal sealed class RequestEmailChangeValidator : AbstractValidator<RequestEmailChangeRequest>
{
    public RequestEmailChangeValidator()
    {
        RuleFor(request => request.NewEmail).NotEmpty().MaximumLength(CreateUserValidator.EmailMaxLength).EmailAddress();
        RuleFor(request => request.CurrentPassword).NotEmpty();
    }
}
