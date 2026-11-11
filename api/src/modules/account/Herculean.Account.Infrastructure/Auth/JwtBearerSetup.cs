using Herculean.SharedKernel.Auth;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Herculean.Account.Infrastructure.Auth;

// Checks each access token against the settings that issued it: issuer, audience, key and lifetime.
internal sealed class JwtBearerSetup(IOptions<JwtOptions> options) : IConfigureNamedOptions<JwtBearerOptions>
{
    public void Configure(string? name, JwtBearerOptions bearerOptions)
    {
        if (name != JwtBearerDefaults.AuthenticationScheme)
        {
            return;
        }

        JwtOptions jwtOptions = options.Value;

        // Keep claim names as they are in the token, for example sub.
        bearerOptions.MapInboundClaims = false;
        bearerOptions.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = jwtOptions.CreateSigningKey(),
            ValidAlgorithms = [JwtOptions.Algorithm],
            RoleClaimType = AuthorizationPolicies.RoleClaim,
        };
    }

    public void Configure(JwtBearerOptions options) => Configure(Options.DefaultName, options);
}
