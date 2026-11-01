using FluentValidation;
using FluentValidation.Results;

using Herculean.Account.Application.Auth;
using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;

namespace Herculean.Account.Application.Sessions.RefreshSession;

internal sealed class RefreshSessionHandler(
    IValidator<RefreshSessionRequest> validator,
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    ITokenIssuer tokenIssuer,
    TimeProvider timeProvider)
{
    public async Task<Result<TokenResponse>> HandleAsync(RefreshSessionRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        string tokenHash = tokenIssuer.HashRefreshToken(request.RefreshToken);
        User? user = await userRepository.GetByRefreshTokenHashAsync(tokenHash, cancellationToken);
        RefreshToken? refreshToken = user?.RefreshTokens.SingleOrDefault(token => token.TokenHash == tokenHash);
        if (user is null || refreshToken is null)
        {
            return UserErrors.InvalidRefreshToken;
        }

        // The token works once. An expired one is removed too, and the user signs in again.
        user.RemoveRefreshToken(refreshToken);
        if (refreshToken.IsExpired(timeProvider.GetUtcNow()))
        {
            await unitOfWork.SaveChangesAsync(cancellationToken);
            return UserErrors.InvalidRefreshToken;
        }

        TokenResponse tokenResponse = tokenIssuer.Issue(user);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return tokenResponse;
    }
}
