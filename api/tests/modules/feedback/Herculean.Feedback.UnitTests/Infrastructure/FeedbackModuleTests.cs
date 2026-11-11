using Herculean.Feedback.Infrastructure;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Herculean.Feedback.UnitTests.Infrastructure;

public sealed class FeedbackModuleTests
{
    [Fact]
    public void RegistersItsDbContextInTheFeedbackSchema()
    {
        HostApplicationBuilder builder = Host.CreateEmptyApplicationBuilder(new HostApplicationBuilderSettings());
        builder.Configuration["ConnectionStrings:database"] = "Host=localhost";
        builder.Services.AddSingleton(TimeProvider.System);

        builder.AddFeedbackModule();

        using ServiceProvider services = builder.Services.BuildServiceProvider();
        using FeedbackDbContext dbContext = services.GetRequiredService<FeedbackDbContext>();
        dbContext.Model.GetDefaultSchema().ShouldBe("feedback");
    }
}
