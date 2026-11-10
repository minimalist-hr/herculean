namespace Herculean.Training.Application.Export.GetExport;

internal sealed class GetExportHandler(IExportReadRepository exportReadRepository)
{
    public Task<ExportResponse> HandleAsync(CancellationToken cancellationToken) =>
        exportReadRepository.GetAsync(cancellationToken);
}
