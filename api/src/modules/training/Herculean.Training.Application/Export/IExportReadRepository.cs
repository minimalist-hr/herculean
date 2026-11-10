using Herculean.Training.Application.Export.GetExport;

namespace Herculean.Training.Application.Export;

/// <summary>Reads everything the user planned and logged, for a copy of their data.</summary>
internal interface IExportReadRepository
{
    Task<ExportResponse> GetAsync(CancellationToken cancellationToken);
}
