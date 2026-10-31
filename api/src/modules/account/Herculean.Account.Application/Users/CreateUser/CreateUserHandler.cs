using FluentValidation;
using FluentValidation.Results;

using Herculean.Account.Application.Auth;
using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;

namespace Herculean.Account.Application.Users.CreateUser;

internal sealed class CreateUserHandler(
    IValidator<CreateUserRequest> validator,
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    IPasswordHasher passwordHasher,
    ITokenIssuer tokenIssuer)
{
    public async Task<Result<TokenResponse>> HandleAsync(CreateUserRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        if (await userRepository.EmailExistsAsync(request.Email, cancellationToken))
        {
            return UserErrors.EmailTaken;
        }

        User user = User.Create(request.Email, passwordHasher.Hash(request.Password), request.TimeZone);
        TokenResponse tokenResponse = tokenIssuer.Issue(user);

        userRepository.Add(user);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return tokenResponse;
    }
}
