using Herculean.Account.Application.Users.ProfilePhotoRemoved;
using Herculean.Account.Contracts;

namespace Herculean.Account.UnitTests.Application.Users.ProfilePhotoRemoved;

public sealed class ProfilePhotoRemovedIntegrationEventHandlerTests
{
    [Fact]
    public async Task TheEmailGoesToTheUser()
    {
        FakeEmailSender emailSender = new();

        await new ProfilePhotoRemovedIntegrationEventHandler(emailSender).HandleAsync(
            new ProfilePhotoRemovedIntegrationEvent("ana@example.com"), TestContext.Current.CancellationToken);

        emailSender.PhotoRemovedEmails.ShouldBe(["ana@example.com"]);
    }
}
