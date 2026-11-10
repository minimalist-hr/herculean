using FluentValidation;
using FluentValidation.Results;

using Herculean.Account.Application.Auth;
using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;

namespace Herculean.Account.Application.Sessions.RevokeSession;

internal sealed class RevokeSessionHandler(
    IValidator<RevokeSessionRequest> validator,
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    ITokenIssuer tokenIssuer)
{
    /// <summary>An unknown token is a success too (RFC 7009): either way, it no longer works.</summary>
    public async Task<Result> HandleAsync(RevokeSessionRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        string tokenHash = tokenIssuer.HashRefreshToken(request.RefreshToken);
        User? user = await userRepository.GetByRefreshTokenHashAsync(tokenHash, cancellationToken);
        RefreshToken? refreshToken = user?.RefreshTokens.SingleOrDefault(token => token.TokenHash == tokenHash);
        if (user is not null && refreshToken is not null)
        {
            user.RevokeRefreshToken(refreshToken);
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return Result.Success();
    }
}
