using FluentValidation;

namespace Herculean.Account.Application.Users.DeleteCurrentUser;

internal sealed class DeleteCurrentUserValidator : AbstractValidator<DeleteCurrentUserRequest>
{
    public DeleteCurrentUserValidator()
    {
        RuleFor(request => request.CurrentPassword).NotEmpty();
    }
}
