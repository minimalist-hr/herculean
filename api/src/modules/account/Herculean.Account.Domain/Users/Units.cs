using System.ComponentModel;

namespace Herculean.Account.Domain.Users;

[Description("The units the app shows and takes: metric in kg and cm, imperial in lb and in. The app converts; the API keeps weights in kg.")]
internal enum Units
{
    Metric,
    Imperial,
}
