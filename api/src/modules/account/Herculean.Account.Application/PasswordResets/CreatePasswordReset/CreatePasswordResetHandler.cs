using FluentValidation;
using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;

namespace Herculean.Account.Application.PasswordResets.CreatePasswordReset;

internal sealed class CreatePasswordResetHandler(
    IValidator<CreatePasswordResetRequest> validator,
    IPasswordResetQueue passwordResetQueue)
{
    public async Task<Result> HandleAsync(CreatePasswordResetRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        passwordResetQueue.Enqueue(request.Email);

        return Result.Success();
    }
}
