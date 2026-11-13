---
title: Setup and getting started
---

## Prerequisites

- Git
- .NET 11 SDK
- Node.js LTS, with npm
- Docker Desktop, for PostgreSQL, pgweb and Mailpit
- Aspire CLI
- Expo Go on your phone
- VS Code with the REST Client extension, Visual Studio or Rider, to send the requests in the `.http` files

## Repository layout

```
.github/             GitHub Actions, Dependabot, issue forms and the PR template
.gitignore            OS and editor files only
.gitattributes
aspire/
  apphost.cs          starts PostgreSQL, pgweb, Mailpit, the API and the app
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
3. Open the Aspire dashboard. It shows the API, PostgreSQL, pgweb, Mailpit and the app.
4. In Expo Go, tap **Enter URL manually** and type the `exp://` address shown on the app in the dashboard, for example `exp://192.168.1.10:8081`.

To use a browser instead of the phone, open the app's **Browser** link from the dashboard. The browser is for development only. Secure storage doesn't work the same there, so check it on the phone.

The phone must be on the same network as the computer. It reaches Metro (Node.js) and the API (`herculean.api.exe`) over it. When Windows asks, allow both through the firewall on the network type you use. A phone hotspot is usually Public. If the app loads but every request fails after 15 seconds, Windows Defender Firewall has a Block rule for `herculean.api.exe`: change it to Allow.

Email sent locally shows up in Mailpit, not in a real inbox. To tap a link in an email on the phone, open the address shown on Mailpit in the dashboard in the phone's browser, for example `http://192.168.1.10:8083`. When Windows asks, allow it through the firewall.

The API reference (Scalar) opens from the API's **Scalar** link in the dashboard.

To have an admin account locally, set one in user secrets from `api/`, then restart the API. Sign in with it on A01: it sees only the feedback inbox.

```
dotnet user-secrets set "Admin:Accounts:0:Email" "admin@example.com" --project src/Herculean.Api
dotnet user-secrets set "Admin:Accounts:0:Password" "<a password>" --project src/Herculean.Api
```

To browse the database, open pgweb from the dashboard. It always runs at `http://localhost:8082`.

To send a request, open a `.http` file, for example `CreateUser.http`, and send one of its requests.

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
