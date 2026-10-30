---
title: Frontend architecture
---

## Folders

```
app/
  src/
    app/          routes (Expo Router). Thin files that render a feature screen.
    features/     one folder per feature
      account/
      exercises/
      routines/
      workout/
      logging/
      settings/
    components/   shared components from design section 5
    theme/        theme built from design-tokens.json
    api/          client generated from the API's OpenAPI document
```

- A feature folder holds that feature's screens, components and API hooks.
- Tests sit next to the code they test, for example `set-row.test.tsx` beside `set-row.tsx`.
- `src/app/` holds only routes, never tests. Expo Router would treat any file there as a screen.

## Navigation

- Account screens sit outside the tabs.
- Four tabs: Home, Workout, Routines, Exercises. Sub-pages open on top of a tab.
- Sheets are components inside the screen that opens them, not routes. A sheet closes back to that screen.

## Data

- Each endpoint has a TanStack Query hook in its feature.
- Query keys are defined once per feature.
- The screen updates before the server answers only in logging (checking, editing and removing sets) and for undo. Everything else waits for the server and shows the design's waiting state.

## Auth

- The access token is kept in memory. The refresh token is kept in secure storage.
- The API client adds the access token to every request.
- On a 401 the client refreshes once and retries. If that fails, the app opens A01.

## Theme

- One provider holds Theme (Match my phone, Dark, Light) and Color (Racing blue, Titanium).
- `useTheme` gives screens the current tokens.
- Styles use tokens only, never raw values.

## Forms

- React Hook Form with a Zod schema per form.
- Errors from the API's Problem Details show under the matching field.

## Formats

- One module holds every format from design section 8: dates, sets, targets, durations, large numbers and units.
- It is the only place formatting is defined.

## Text

- English only. Text is written in the screens, with no translation library.

## Tests

- **Logic** (formats, hooks, state) is written test-first.
- **Screens:** React Native Testing Library tests for the main flows.
- No snapshot tests.
