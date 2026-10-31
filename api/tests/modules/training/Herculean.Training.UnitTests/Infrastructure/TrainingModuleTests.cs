using Herculean.Training.Infrastructure;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Herculean.Training.UnitTests.Infrastructure;

public sealed class TrainingModuleTests
{
    [Fact]
    public void RegistersItsDbContextInTheTrainingSchema()
    {
        HostApplicationBuilder builder = Host.CreateEmptyApplicationBuilder(new HostApplicationBuilderSettings());
        builder.Configuration["ConnectionStrings:database"] = "Host=localhost";
        builder.Services.AddSingleton(TimeProvider.System);

        builder.AddTrainingModule();

        using ServiceProvider services = builder.Services.BuildServiceProvider();
        using TrainingDbContext db = services.GetRequiredService<TrainingDbContext>();
        db.Model.GetDefaultSchema().ShouldBe("training");
    }
}
