---
title: Configuration
---

## API

- Settings come from `appsettings.json`, then from environment variables, which win.
- Each section is a typed options class, validated at startup. A missing or wrong setting stops the API with a clear error.
- Secrets never go in the repo. Locally they are Aspire parameters. In CI they are masked GitLab CI/CD variables.

### API settings

| Section | Setting | Secret | Value |
|---|---|---|---|
| ConnectionStrings | Database | Yes | Set by Aspire locally |
| Jwt | Issuer | | |
| Jwt | Audience | | |
| Jwt | SigningKey | Yes | |
| Jwt | AccessTokenLifetime | | 15 minutes |
| Jwt | RefreshTokenLifetime | | 30 days, renewed on each refresh |
| Tokens | PasswordResetLifetime | | 1 hour. Must match the A11 copy. |
| Tokens | EmailChangeLifetime | | 24 hours |
| Email | ResendApiKey | Yes | |
| Email | From | | `Herculean <no-reply@minimalist.hr>` |
| Links | BaseUrl | | Public URL of the API, used in email links |

## App

| Setting | Where | Value |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Environment | API address. Set by Aspire locally and by EAS for builds. |
| Link scheme | `app.config.ts` | `herculean` |
| App ID | `app.config.ts` | `hr.minimalist.herculean` (iOS bundle ID and Android package). It cannot change after the app is published. |

### EAS profiles

| Profile | Used for |
|---|---|
| `development` | Local development |
| `preview` | Testers: an Android APK, and updates that open in Expo Go on iPhone |

## CI

| Variable | Secret | Value |
|---|---|---|
| `WIKI_TOKEN` | Yes | Personal access token with the `write_repository` scope. Used by the `wiki` job. Masked and protected. |
