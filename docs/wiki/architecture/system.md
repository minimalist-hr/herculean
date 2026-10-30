---
title: System architecture
---

## Parts

```mermaid
flowchart LR
    app["App<br/>React Native, Expo"]
    api["API<br/>ASP.NET Core<br/>modules: Account, Training"]
    db[("PostgreSQL<br/>schemas: account, training")]
    email["Resend"]
    inbox["User's inbox"]

    app -- "HTTPS, JSON" --> api
    api --> db
    api -- "reset and email change links" --> email
    email --> inbox
    inbox -- "link opens redirect page" --> api
    api -. "redirect into the app" .-> app
```

- **App:** the phone app. It talks only to the API. See [Frontend architecture](/architecture/frontend).
- **API:** one process with two modules, `Account` and `Training`. It also runs background jobs. See [Backend architecture](/architecture/backend).
- **PostgreSQL:** one database, one schema per module.
- **Resend:** sends email. Locally, Mailpit takes its place. See [Configuration](/development/configuration).

## Email links

Links in email open the app through a redirect page.

1. The email links to an HTTPS page served by the API, for example `/links/reset-password?token=…`.
2. The page redirects into the app using the app's link scheme.
3. The app opens the matching screen, for example A12 for a password reset.

This works in Expo Go and in a built app.
