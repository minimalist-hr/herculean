## API

- Settings come from `appsettings.json`, then from environment variables, which win.
- Each section is a typed options class, validated at startup. A missing or wrong setting stops the API with a clear error. The build skips this check when it starts the API to write `openapi.json`.
- Secrets never go in the repo. Locally they are Aspire parameters. In CI they are GitHub Actions secrets.

### API settings

| Section | Setting | Secret | Value |
|---|---|---|---|
| ConnectionStrings | Database | Yes | Set by Aspire locally |
| Jwt | Issuer | | `herculean-api` |
| Jwt | Audience | | `herculean-app` |
| Jwt | SigningKey | Yes | At least 32 characters. Locally, Aspire generates a new one on each run. |
| Jwt | AccessTokenLifetime | | 15 minutes |
| Jwt | RefreshTokenLifetime | | 30 days, renewed on each refresh |
| Tokens | ResetLinkLifetime | | 1 hour. Must match the A11 copy. |
| Tokens | EmailChangeLifetime | | 24 hours |
| Email | Host | | `smtp.resend.com`. Set by Aspire locally, for Mailpit. |
| Email | Port | | `465`, which is TLS from the start. Set by Aspire locally. |
| Email | Username | | `resend` |
| Email | Password | Yes | The Resend API key. Empty locally: Mailpit needs no sign in. |
| Email | From | | `Herculean <no-reply@minimalist.hr>` |
| Links | BaseUrl | | Public URL of the API, used in email links. Set by Aspire locally. |
| Links | AppUrl | | What a link into the app starts with: `herculean://`. Set by Aspire locally to the Expo Go address, for example `exp://192.168.1.10:8081/--/`. |
| Admin | Accounts | Yes | Minimalist's admin accounts, a list of `Email` and `Password` (8 to 128 characters). Each gets an account at startup if it has none, and a changed password replaces the old one. Locally in user secrets, see [Setup](Setup-and-getting-started#run); elsewhere `Admin__Accounts__0__Email` and `Admin__Accounts__0__Password` from secrets. |
| BrowserPreview | Origin | | Development only. The browser preview's address, the only origin CORS allows. Set by Aspire. |

## App

| Setting | Where | Value |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Environment | API address. Set by Aspire locally. |
| Link scheme | `app.config.ts` | `herculean` |
| App ID | `app.config.ts` | `hr.minimalist.herculean` (iOS bundle ID and Android package). It cannot change after the app is published. |

## CI

| Secret | Value |
|---|---|
| `SONAR_TOKEN` | SonarQube Cloud token, for the `sonar` job. A repository secret for Actions |
