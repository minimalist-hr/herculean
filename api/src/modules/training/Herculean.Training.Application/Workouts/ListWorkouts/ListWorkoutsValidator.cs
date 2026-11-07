using FluentValidation;

namespace Herculean.Training.Application.Workouts.ListWorkouts;

internal sealed class ListWorkoutsValidator : AbstractValidator<ListWorkoutsRequest>
{
    internal const string InProgress = "inProgress";

    public ListWorkoutsValidator()
    {
        RuleFor(request => request.Status)
            .Equal(InProgress)
            .WithMessage("Status must be inProgress.");
    }
}
