---
title: Tech stack
---

Exact versions live in the code. We use the latest stable versions, except where a version is named here.

## App

Every app library must work in Expo Go.

| Need | Choice |
|---|---|
| Framework | React Native, Expo |
| Language | TypeScript, strict |
| Navigation | Expo Router |
| Server data | TanStack Query |
| API client | openapi-typescript, openapi-fetch (generated from the API) |
| Forms | React Hook Form, Zod |
| Styling | StyleSheet, theme from `design-tokens.json` (no UI kit) |
| Fonts | expo-font, expo-splash-screen, @expo-google-fonts/chakra-petch |
| Icons, chart | react-native-svg |
| Gestures, animation | react-native-gesture-handler, react-native-reanimated |
| Sheets | Own component, `components/sheet.tsx` |
| Animation | react-native-reanimated |
| Drag lists | react-native-draggable-flatlist |
| Token storage | expo-secure-store |
| Profile photo | expo-image-picker |
| Browser preview, development only | react-native-web, @expo/metro-runtime |
| Tests | Jest (jest-expo), React Native Testing Library |
| Lint, format | ESLint, Prettier |

## API

| Need | Choice |
|---|---|
| Framework | .NET 10, ASP.NET Core minimal API |
| Database | PostgreSQL |
| Data access | EF Core, Npgsql |
| Validation | FluentValidation |
| API docs | Built-in OpenAPI, Scalar |
| Auth | Our own, no ASP.NET Core Identity ([details](/architecture/backend#auth)) |
| Email | Resend, over SMTP with MailKit |
| Logs, traces | OpenTelemetry |
| Tests | xUnit v3, ArchUnitNET, Shouldly, Testcontainers |
| Format | .editorconfig, dotnet format |

## Tooling

| Need | Choice |
|---|---|
| Local run | Aspire |
| Local email | Mailpit |
| CI | GitLab CI |
| Code quality | SonarQube Cloud |
| App builds and updates | EAS |
