---
title: Backend architecture
---

## Principles

Modular monolith, clean architecture, domain-driven design, SOLID, vertical slices, REPR, test-driven.

**Explicit:** nothing is wired by scanning or hidden in filters. When a piece is missing, a test or the compiler fails.

## Projects

```
api/
  src/
    Herculean.Api/                 host: composes the modules
    Herculean.ServiceDefaults/     OpenTelemetry, health checks
    Herculean.SharedKernel/        Result, typed IDs, entity base, module database, outbox
    modules/
      account/
        Herculean.Account.Domain/
        Herculean.Account.Application/
        Herculean.Account.Infrastructure/
        Herculean.Account.Contracts/
      training/
        Herculean.Training.Domain/
        Herculean.Training.Application/
        Herculean.Training.Infrastructure/
        Herculean.Training.Contracts/
  tests/
    Herculean.ArchitectureTests/
    Herculean.SharedKernel.UnitTests/
    modules/
      account/
        Herculean.Account.UnitTests/
      training/
        Herculean.Training.UnitTests/
```

### Dependencies

| Project | May reference |
|---|---|
| Domain | SharedKernel |
| Application | Domain, SharedKernel, any module's Contracts |
| Infrastructure | Application, Domain, SharedKernel, any module's Contracts (to register its event handlers) |
| Contracts | Nothing |
| Api (host) | Each module's Infrastructure, ServiceDefaults |

A module never references another module's Domain, Application or Infrastructure.

- **Closed modules:** outside a module, only its Module class and its Contracts are public. Domain and Application types are internal. Each project shows its internals only to the later layers of its own module and to that module's unit tests.
- **Sealed:** every class is sealed unless another class extends it.
- **As private as possible:** every type and member gets the narrowest access that works.

## Slices

One folder per use case in Application:

```
Herculean.Training.Application/
  Exercises/
    CreateExercise/
      CreateExerciseRequest.cs
      CreateExerciseEndpoint.cs
      CreateExerciseResponse.cs
      CreateExerciseHandler.cs
      CreateExerciseValidator.cs
      CreateExercise.http
```

- **Endpoint:** HTTP only. It holds the route and auth, calls the handler and turns its `Result` into an HTTP response. Each parameter names where it comes from: `[FromBody]`, `[FromRoute]`, `[FromQuery]` or `[FromServices]`.
- **Handler:** the use case. Its first step calls the validator.
- **Domain service:** a business rule across aggregates, in Domain. It is named for what it does, with no `Service` suffix, for example `WeekPlanner`. It knows no clock and no responses: the handler passes in what it needs.
- **Application service:** a helper for handlers that is no use case, in Application, for example `CurrentUser` and `UserClock`.
- **Validator:** FluentValidation. Every request has one.
- **No input, no request:** an endpoint with no input, for example "list my routines", has no request type.
- **Routes:** each resource keeps its routes and OpenAPI tag as constants in one class in Application, for example `UserRoutes.Me`. Each endpoint keeps its name in a `Name` constant.
- **Documentation:** each endpoint is fully documented for Scalar when it is built. Its method has a summary, a description and every response with its own description. Each request and response type, and each of their fields, has a `[Description]`.
- **Requests file:** each slice has a `.http` file next to its endpoint, for example `CreateUser/CreateUser.http`, with an example of every outcome. When the endpoint needs a signed-in user, the file first creates an account and sends its access token as the Bearer.

### Explicit wiring

- Each module has one `Add<Module>Module` method, for example `AddAccountModule`. It registers every handler, validator and repository by name.
- Each module has one `Map<Module>ModuleEndpoints` method. It maps every endpoint by name.
- Each module has one `Migrate<Module>ModuleDatabaseAsync` method. The API calls it at startup in Development.
- Each entity has its own EF Core configuration class.

## Data access

- **Writes** go through a repository per [aggregate](/product/domain#modules-and-aggregates). Business rules live in the aggregates, not in handlers. The interface is in Domain, the code in Infrastructure. A repository returns aggregates to change, or answers a check that a write needs, such as `NameExistsAsync`. It never returns data for display.
- **Unit of work:** a handler saves once, through its module's `IUnitOfWork`, which is the module's DbContext. Repositories never save.
- **Reads** query the DbContext directly with projections. Each has a read repository: its interface in Application, for example `IExerciseReadRepository`, and its code in Infrastructure. It returns what a response needs, and never changes anything.
- **One database:** one schema and one DbContext per module.
- **Migrations:** each module keeps its own in `Infrastructure/Migrations/`. In Development the API applies them at startup.
- **Foreign keys** never cascade in the database: they are `ON DELETE RESTRICT`, or `NO ACTION` where EF deletes the children itself. Code deletes child rows on purpose. A child removed from its aggregate, for example a used refresh token, is deleted on save (EF client cascade).
- **Query filters:** Training has named EF Core filters for `UserId` and for soft delete, so a query never needs its own. A filtered query without a signed-in user throws, so it can never read everyone's rows. The signature shows which is which: a repository method that takes a `UserId` turns the user filter off, for a background job that has no signed-in user. One that takes none reads the current user's rows.
- **Current user:** SharedKernel's `ICurrentUserAccessor` reads the `sub` claim of the access token, for the whole API. Each module wraps it in its own `CurrentUser`, with the module's own `UserId`.
- **Typed IDs:** each ID is a record struct of our own, with an EF Core converter. Each module has its own `UserId`: Account owns users, and Training only refers to them. Between modules, IDs travel as plain `Guid`s.
- **Undo:** workouts and groups have a restore endpoint.

## Errors

- Expected failures (validation, not found, conflict) return our own `Result` type.
- Each aggregate's errors are in Domain, next to it, for example `UserErrors.EmailTaken`.
- The endpoint turns a failed `Result` into a Problem Details response (RFC 9457).
- Every error has the same fields: `type`, `title` (the HTTP status name), `status`, `detail`, `code` and `traceId`. A validation error is 400 with code `validation`, and also has `errors`, with messages per field. Errors that ASP.NET Core creates get the same fields, with a code from the status name, for example `not_found`. A value it can't read, for example a group that isn't an ID, is 400 with code `bad_request`, in every environment and without an exception.
- Exceptions are only for bugs.

## Events between modules

- Modules talk through events and through queries in Contracts.
- A query is a record in the answering module's Contracts, for example `GetUserTimeZoneQuery`. That module answers it with an `IQueryHandler<TQuery, TResult>`, named after the query, for example `GetUserTimeZoneQueryHandler`. It only reads. The asking module injects the handler by that interface.
- Events use an outbox. A module that sends events has an `outbox_messages` table in its schema.
- An event is a record in the sending module's Contracts, for example `AccountCreatedIntegrationEvent`. The handler adds it with `IOutbox`, and the unit of work saves it in the same transaction as the change.
- A receiving module handles it with an `IIntegrationEventHandler<T>`, named after the event, for example `AccountCreatedIntegrationEventHandler`, and registered with `AddIntegrationEventHandler`.
- After the save, the outbox job wakes and sends the event to every registered handler, each in its own scope. It also checks every 30 seconds. A save without events leaves it asleep.
- A failed event is tried again on each check, up to 5 times. Its last error stays in the table and in the logs.
- Event handlers are idempotent, because the outbox can send an event twice.

| Event | From | Handled by | What happens |
|---|---|---|---|
| Account created | Account | Training | Creates workout settings with their starting values, and the 6 groups |

## Auth

- Passwords are hashed with the ASP.NET Core password hasher. Sign in hashes a password again when the hasher's settings get stronger.
- The access token is a JWT. It is checked by signature and never stored.
- Refresh tokens, password reset tokens and email change tokens are stored hashed.
- Each refresh replaces the refresh token with a new one. An expired refresh token is removed when it is used, and the user signs in again.
- A wrong email and a wrong password get the same 401 and take as long, so sign in never tells which emails have an account.
- Sign in, refresh, sending a reset link, completing a reset and changing the password each allow 10 tries a minute per IP address, counted apart, so failed sign ins never block refreshing. More get a 429 with `Retry-After`.
- Sending a reset link answers 202 for every valid email, and the work happens after the answer, so the request never tells which emails have an account. The queue holds only the email: the token is created when the email goes out, so the plain token is never stored.
- The API checks every access token's signature, issuer, audience and lifetime.
- Every endpoint needs a signed-in user unless it is marked anonymous. Creating an account, sign in, refresh, password resets, the health check and the API docs are anonymous.
- The OpenAPI document has the Bearer scheme, so Scalar can send an access token.
- Tokens are returned as the OAuth 2.0 token response (RFC 6749), in camelCase: `accessToken`, `expiresIn` (seconds) and `refreshToken`.

## Time

- Code gets the time from `TimeProvider`, so tests can control it.
- Points in time are `DateTimeOffset`. Local dates are `DateOnly`.

## Background jobs

- Jobs are `BackgroundService`s. There is no job library.
- **Outbox:** sends saved events.
- **Password reset email:** sends the reset links waiting in the queue, one at a time. The queue is in memory: a restart loses what is waiting, and a failed email is only logged. In both cases the user can send the link again.

## Email

- Email goes out over SMTP with MailKit: to Resend in production and to Mailpit locally, so both run the same code.
- The password changed email goes through the outbox, and Account handles its own event. It is sent only if the change saved, a failed send is tried again, and the event holds only the user's ID and the time. The email shows that time in the user's time zone.
- Each email has HTML and plain text. The HTML follows section 5 of the [design document](https://gitlab.com/minimalist-sds/herculean/-/blob/main/docs/design/design-document.md), and is an embedded resource next to its code.

## Logging

- Code logs through `ILogger<T>` with `[LoggerMessage]` methods. The build writes their bodies, checks each template against its parameters, and skips the work when the level is off.
- Background jobs log their errors, and so does code that catches a failure. ASP.NET Core logs unhandled errors.
- Passwords, tokens and emails are never logged.
- EF Core logs each SQL command at Information. The API shows only its warnings and errors from that category, so the outbox's regular checks fill no logs.
- Logs, traces and metrics go through OpenTelemetry to the Aspire dashboard.

## Tests

- **Unit tests:** Domain, handlers and module wiring. One test project per module, and one for SharedKernel.
- **Architecture tests:** ArchUnitNET checks the dependency rules, closed modules and sealed classes above.
- **Guard tests:** they fail when a piece is missing:
  1. Every request has a validator.
  2. Every handler, validator and repository is registered in its module.
  3. Every endpoint is mapped.
  4. Every entity has a configuration class.
  5. Every handler has a unit test class.
  6. Every Training entity has a `UserId`, and the query filters for its `UserId` and `DeletedAtUtc`.
  7. Every endpoint, response, schema and field in `openapi.json` has a description.
- **Endpoint tests:** HTTP behaviour, like status codes, auth and rate limits, through an in-memory server (TestHost) with the module's own wiring and fake stores.
- **Postgres translation tests:** a read the in-memory database runs but Postgres might not, such as grouping, runs against the Npgsql provider with no server. Failing to connect means the query translated. Each new read like that gets one.
- **Integration tests:** the API against a real PostgreSQL in Testcontainers. Written last.
