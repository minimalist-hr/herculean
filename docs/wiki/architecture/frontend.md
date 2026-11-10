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
      home/
      routines/
      settings/
      workout/
    components/   shared components from design section 5
    theme/        theme built from design-tokens.json
    formats/      every format from design section 8, and date arithmetic
    api/          client generated from the API's OpenAPI document
    storage/      what the phone keeps
    test-utils/   helpers for tests
```

- A feature folder holds that feature's screens, components and API hooks.
- Tests sit next to the code they test, for example `set-row.test.tsx` beside `set-row.tsx`.
- `src/app/` holds only routes, never tests. Expo Router would treat any file there as a screen.

## Navigation

- Account screens sit outside the tabs.
- The session status decides the screens. The root layout guards each group with `Stack.Protected`, and a screen the status doesn't allow opens that status's first screen:

  | Status | Screens | Opens |
  |---|---|---|
  | Restoring | Launch | A00 |
  | Signed out | Sign in, Create account, A10–A12 | A01 |
  | Needs setup | Setup | A30 |
  | Ready | The tabs | Home |

- Terms and privacy are open in every status.
- A10–A12 are also open while restoring, so a reset link can open the app from closed. A signed-in user who opens a link with the app already running goes to Home.
- Four tabs: Home, Workout, Routines, Exercises. Sub-pages open on top of the tabs, or in a tab's own stack when the design keeps the tab bar, as Exercises does. Only a tab's first page shows the tab bar and the Resume bar; every other page in a tab hides them (`hidesTabBar` in `components/tab-bar.tsx`), and `useEndRoom` keeps room at a page's end for whichever is there. Lists with search keep it at the top with `components/sticky-controls.tsx`. A tab always opens its first page: leaving it pops its stack (`popToTopOnBlur`), and pages pushed from another tab use `withAnchor`, so the first page sits under them. Pages opened from Home take `from=home` and go back through `features/home/use-go-back.ts`, which handles Android's back too.
- Anything tappable uses `components/tappable.tsx`, so it reacts when pressed. Lint rejects a plain `Pressable`. What it shows at rest is in section 7 of the [design document](https://gitlab.com/minimalist-sds/herculean/-/blob/main/docs/design/design-document.md).
- Creating and editing are pages, built on `components/form-page.tsx`. `components/use-leave-guard.tsx` asks before leaving one with changes. Pages that work on one routine share it through `features/routines/routine-draft.tsx`. Deletes, confirmations and quick picks are sheets. See `docs/design/design-document.md` for the exceptions. Sheets are components inside the screen that opens them, not routes. A sheet closes back to that screen, or to the sheet below it when one opened another.

## Data

- **API client:** every API build writes `api/openapi.json`. `npm run api:generate` turns it into `src/api/schema.ts`, which is never edited by hand. CI fails if either file is out of date. Steps are in [Setup](/development/setup#change-an-endpoint).
- Each endpoint has a TanStack Query hook in its feature.
- A request with no answer fails after 15 seconds and shows a notification or the screen's error, so no screen waits forever.
- A read that fails quickly is tried once more, for a blip in the connection. One that waited out its 15 seconds, or that the API refused, is not.
- A change made in the app refreshes what it changes. Coming back to a screen reads the days again only on another date, and waking the app always does. Pulling down on Home reads everything on it again.
- A refresh that fails keeps what is showing. A failure shows only when there is nothing to show.
- Query keys are defined once per feature.
- The screen updates before the server answers only in logging (checking, editing and removing sets) and for undo. Everything else waits for the server and shows the design's waiting state.

## Auth

- The access token is kept in memory. The refresh token is kept in secure storage on the phone, and in memory on the web, which has no secure storage. `features/account/session.ts` holds both, and the session status.
- At launch, A00 refreshes the stored token, then reads the current user. A user without a name still needs setup. No token, or a refused one, signs the user out. With no answer, the token is kept and A02 offers to try again.
- The user read at launch or at sign in is kept in the query cache, so the first screen already knows the units and the name. `useUnits` gives screens the units.
- The API client adds the access token to every request.
- On a 401 the client refreshes once and retries. Requests that fail together share one refresh. If the refresh is refused, the user is signed out and A01 opens.

## Theme

- `src/theme/tokens.ts` is a copy of `docs/design/tokens/design-tokens.json`. A test fails when they differ.
- One provider holds Theme (Match my phone, Dark, Light) and Color (Nitro, Chrome), saved on the user. A copy on the phone shows them from the first frame. With neither, they are Match my phone and Nitro. A phone with no preference gets dark.
- The status bar follows the app's theme, not the phone's.
- `useTheme` gives screens the current tokens.
- Styles use tokens only, never raw values.
- Every text style turns off Android's extra font padding, so text sits in the middle of its box on both platforms.
- Corners are always sharp. Soft corners were a design-tool option, not an app setting.
- Chakra Petch loads at startup. The native splash screen stays up until it is ready. It shows only the background; A00 draws the logo and its glow.

## Forms

- React Hook Form with a Zod schema per form.
- Errors show as set out in the design's Form errors (section 5). `toFormErrors` in `api/problem.ts` sorts the API's Problem Details into field errors and the general error. A general error goes to `notifyFailure` in `components/notifications.ts`.

## Formats

- One module, `formats/formats.ts`, holds every format from design section 8: dates, sets, targets, durations, large numbers and units. Each format is added when a screen first needs it.
- It is the only place formatting is defined.

## Text

- English only. Text is written in the screens, with no translation library.
- `src/copy.test.ts` fails on a straight apostrophe or an em dash, in the app or in the messages the API sends.

## Tests

- **Logic** (formats, hooks, state) is written test-first.
- **Screens:** React Native Testing Library tests for the main flows.
- No snapshot tests.
