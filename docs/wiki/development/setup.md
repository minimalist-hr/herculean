---
title: Setup and getting started
---

## Prerequisites

- Git
- .NET 10 SDK
- Node.js LTS, with npm
- Docker Desktop, for PostgreSQL and Mailpit
- Aspire CLI
- Expo Go on your phone

## Repository layout

```
.gitlab-ci.yml
.gitignore            OS and editor files only
.gitattributes
.gitlab/              issue and merge request templates
aspire/
  apphost.cs          starts PostgreSQL, Mailpit, the API and the app
api/                  .NET: solution, shared .NET settings, src/, tests/
app/                  Expo app
docs/
  design/             the design: UI spec
  wiki/               this wiki
```

The insides of `api/` and `app/` are on [Backend architecture](/architecture/backend#projects) and [Frontend architecture](/architecture/frontend#folders).

## Run

1. Clone the repo.
2. From `aspire/`, run `aspire run`.
3. Open the Aspire dashboard. It shows the API, PostgreSQL, Mailpit and the app.
4. In Expo Go, tap **Enter URL manually** and type the app's **Expo Go** link from the dashboard, for example `exp://192.168.1.10:8081`.

The phone must be on the same Wi-Fi as the computer. If Windows asks, let .NET and Node.js through the firewall on private networks.

Email sent locally shows up in Mailpit, not in a real inbox.

The API reference (Scalar) is at `/scalar` on the API's address.

## Change an endpoint

1. Build the API. The build writes `api/openapi.json`.
2. From `app/`, run `npm run api:generate`. It writes `src/api/schema.ts`.
3. Commit both files.

## Add a migration

From `api/`, for example for Account:

```
dotnet tool restore
dotnet ef migrations add <Name> --project src/modules/account/Herculean.Account.Infrastructure --startup-project src/Herculean.Api --context AccountDbContext --output-dir Migrations -- --ConnectionStrings:database "Host=localhost"
```

The connection string only satisfies the startup check. Adding a migration doesn't connect to the database.

## Test

- API: from `api/`, run `dotnet test`.
- App: from `app/`, run `npm test`.
