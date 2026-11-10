using Herculean.Training.Application.Export;
using Herculean.Training.Application.Export.GetExport;

namespace Herculean.Training.UnitTests.Application.Export.GetExport;

public sealed class GetExportHandlerTests
{
    private sealed class FakeExportReadRepository : IExportReadRepository
    {
        public ExportResponse Export { get; } = new([new ExportedExercise("Squat", "Legs", [])], [], []);

        public Task<ExportResponse> GetAsync(CancellationToken cancellationToken) => Task.FromResult(Export);
    }

    [Fact]
    public async Task ReturnsWhatTheReadGives()
    {
        FakeExportReadRepository read = new();

        ExportResponse export = await new GetExportHandler(read).HandleAsync(TestContext.Current.CancellationToken);

        export.ShouldBe(read.Export);
    }
}
