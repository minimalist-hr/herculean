using FluentValidation;

namespace Herculean.Account.Application.EmailChanges.ConfirmEmailChange;

internal sealed class ConfirmEmailChangeValidator : AbstractValidator<ConfirmEmailChangeRequest>
{
    public ConfirmEmailChangeValidator()
    {
        RuleFor(request => request.Token).NotEmpty();
    }
}
