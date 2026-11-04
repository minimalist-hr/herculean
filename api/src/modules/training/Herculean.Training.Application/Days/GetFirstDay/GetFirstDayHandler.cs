using Herculean.Account.Contracts;
using Herculean.SharedKernel.Queries;
using Herculean.Training.Application.Auth;

namespace Herculean.Training.Application.Days.GetFirstDay;

internal sealed class GetFirstDayHandler(
    IDayReadRepository dayReadRepository,
    IQueryHandler<GetUserCreatedAtQuery, DateTimeOffset> getUserCreatedAt,
    UserClock userClock,
    CurrentUser currentUser)
{
    public async Task<FirstDayResponse> HandleAsync(CancellationToken cancellationToken)
    {
        UserCalendar calendar = await userClock.GetCalendarAsync(cancellationToken);
        DateTimeOffset createdAtUtc = await getUserCreatedAt.HandleAsync(new GetUserCreatedAtQuery(currentUser.UserId.Value), cancellationToken);
        DateOnly created = calendar.DateOf(createdAtUtc);
        DateOnly? firstWorkout = await dayReadRepository.GetFirstWorkoutDateAsync(cancellationToken);

        return new FirstDayResponse(firstWorkout < created ? firstWorkout.Value : created);
    }
}
