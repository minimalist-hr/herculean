using Herculean.Account.Infrastructure.Email;

using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

namespace Herculean.Account.UnitTests.Infrastructure.Email;

public sealed class EmailHealthCheckTests
{
    [Fact]
    public async Task AnUnreachableServerIsDown()
    {
        EmailOptions options = new() { Host = "127.0.0.1", Port = 1, Username = "resend", From = "Herculean <no-reply@minimalist.hr>" };

        HealthCheckResult result = await new EmailHealthCheck(Options.Create(options)).CheckHealthAsync(new HealthCheckContext(), TestContext.Current.CancellationToken);

        result.Status.ShouldBe(HealthStatus.Unhealthy);
        result.Description.ShouldBe("Couldn’t reach 127.0.0.1.");
    }
}
