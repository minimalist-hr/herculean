---
title: Backend architecture
---

## Principles

Modular monolith, clean architecture, domain-driven design, vertical slices, REPR, test-driven.

**Explicit:** nothing is wired by scanning or hidden in filters. When a piece is missing, a test or the compiler fails.

## Projects

```
api/
  src/
    Herculean.Api/                 host: composes the modules
    Herculean.ServiceDefaults/     OpenTelemetry, health checks
    Herculean.SharedKernel/        Result, typed ID base, entity base, outbox
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
| Application | Domain, SharedKernel, other modules' Contracts |
| Infrastructure | Application, Domain, SharedKernel |
| Contracts | Nothing |
| Api (host) | Each module's Infrastructure, ServiceDefaults |

A module never references another module's Domain, Application or Infrastructure.

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
```

- **Endpoint:** HTTP only. It holds the route and auth, calls the handler and turns its `Result` into an HTTP response.
- **Handler:** the use case. Its first step calls the validator.
- **Validator:** FluentValidation. Every request has one.
- **No input, no request:** an endpoint with no input, for example "list my routines", has no request type.

### Explicit wiring

- Each module has one `Add<Module>` method. It registers every handler, validator and repository by name.
- Each module has one `Map<Module>Endpoints` method. It maps every endpoint by name.
- Each entity has its own EF Core configuration class.

## Data access

- **Writes** go through a repository per [aggregate](/product/domain#modules-and-aggregates). Business rules live in the aggregates, not in handlers. The interface is in Domain, the code in Infrastructure.
- **Reads** query the DbContext directly with projections.
- **One database:** one schema and one DbContext per module.
- **Foreign keys** are `ON DELETE RESTRICT`. Code deletes child rows on purpose.
- **Query filters:** named EF Core filters for `UserId` and for soft delete. A filter can be turned off on its own, for example by a background job.
- **Current user:** a service in each module, filled from the access token.
- **Typed IDs:** each ID is a record struct of our own, with an EF Core converter.
- **Undo:** workouts and groups have a restore endpoint.

## Errors

- Expected failures (validation, not found, conflict) return our own `Result` type.
- The endpoint turns a failed `Result` into a Problem Details response.
- Exceptions are only for bugs.

## Events between modules

- Modules talk through events and through queries in Contracts.
- Events use an outbox. Each module has an outbox table. An event is saved in the same transaction as the change, and a background job sends it.

| Event | From | Handled by | What happens |
|---|---|---|---|
| Account created | Account | Training | Creates training settings with their starting values, and the 6 groups |
| Account deleted | Account | Training | Deletes the user's training data |

## Auth

- Passwords are hashed with the ASP.NET Core password hasher.
- The access token is a JWT. It is checked by signature and never stored.
- Refresh tokens, password reset tokens and email change tokens are stored hashed.
- Each refresh replaces the refresh token with a new one.

## Time

- Code gets the time from `TimeProvider`, so tests can control it.
- Points in time are `DateTimeOffset`. Local dates are `DateOnly`.

## Background jobs

- **Outbox:** sends saved events.
- **Token cleanup:** deletes expired tokens, as set out in [Domain and entities](/product/domain#account).

## Tests

- **Unit tests:** Domain and handlers. One test project per module.
- **Architecture tests:** ArchUnitNET checks the dependency rules above.
- **Guard tests:** they fail when a piece is missing:
  1. Every request has a validator.
  2. Every handler, validator and repository is registered in its module.
  3. Every endpoint is mapped.
  4. Every entity has a configuration class.
  5. Every handler has a unit test class.
  6. Every Training entity has a `UserId`.
- **Integration tests:** the API against a real PostgreSQL in Testcontainers. Written last.
