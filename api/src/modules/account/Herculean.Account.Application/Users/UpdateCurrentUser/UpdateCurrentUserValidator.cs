using FluentValidation;

namespace Herculean.Account.Application.Users.UpdateCurrentUser;

internal sealed class UpdateCurrentUserValidator : AbstractValidator<UpdateCurrentUserRequest>
{
    public UpdateCurrentUserValidator()
    {
        RuleFor(request => request.Name!).UserName().When(request => request.Name is not null);
        RuleFor(request => request.Units).IsInEnum();
        RuleFor(request => request.TimeZone!).IanaTimeZone().When(request => request.TimeZone is not null);
    }
}
