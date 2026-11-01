using Herculean.Account.Application.Auth;
using Herculean.Account.Application.Email;
using Herculean.Account.Application.PasswordResets.SendPasswordResetEmail;
using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.Account.Infrastructure.PasswordResets;
using Herculean.Account.UnitTests.Application;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

namespace Herculean.Account.UnitTests.Infrastructure.PasswordResets;

public sealed class PasswordResetEmailJobTests
{
    [Fact]
    public async Task AFailedEmailDoesNotStopTheNextOne()
    {
        FakeUserRepository userRepository = new();
        userRepository.Add(User.Create("first@example.com", "hash", "Europe/Zagreb"));
        userRepository.Add(User.Create("second@example.com", "hash", "Europe/Zagreb"));
        FakeEmailSender emailSender = new() { FailNext = true };

        ServiceCollection services = new();
        services.AddSingleton<IUserRepository>(userRepository);
        services.AddSingleton<IUnitOfWork>(new FakeUnitOfWork());
        services.AddSingleton<IPasswordResetTokenIssuer>(new FakePasswordResetTokenIssuer());
        services.AddSingleton<IEmailSender>(emailSender);
        services.AddScoped<SendPasswordResetEmailHandler>();
        await using ServiceProvider provider = services.BuildServiceProvider();

        PasswordResetQueue queue = new();
        using PasswordResetEmailJob job = new(queue, provider.GetRequiredService<IServiceScopeFactory>(), NullLogger<PasswordResetEmailJob>.Instance);
        await job.StartAsync(TestContext.Current.CancellationToken);

        queue.Enqueue("first@example.com");
        queue.Enqueue("second@example.com");

        (await emailSender.Sent.ReadAsync(TestContext.Current.CancellationToken)).Email.ShouldBe("second@example.com");
        await job.StopAsync(TestContext.Current.CancellationToken);
    }
}
