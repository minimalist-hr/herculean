---
title: Conventions
---

## How we work

- Every change goes on a branch and reaches `main` through a pull request (PR).
- The wiki is updated in the same PR as the change it describes.
- A new wiki page is listed both on [Home](/home) and in `_sidebar.md`.
- A design change is proposed and approved before it is built.
- After every big feature, a consistency pass compares all built screens and fixes what differs.
- Every state of a built screen has an ID and a capture. A PR that changes a screen also recaptures it, with all its states, using [`docs/design/capture`](https://github.com/minimalist-hr/herculean/tree/main/docs/design/capture).
- Screens are named by ID, for example W10.
- Each fact is written once, in one place, and linked from elsewhere.
- H20 and H21 stay true: a change to what the app stores, who receives it or where it lives updates them in the same PR, with a new "Last updated" date.

## Vocabulary

The terms in [Domain and entities](/product/domain#terms) are used unchanged in the app, API, database and docs.

## Naming

### Folders

- Repo-level folders are lowercase: `api`, `app`, `aspire`, `docs`, `src`, `tests`, `modules`, `account`, `training`, `feedback`.
- A .NET project folder has the project's name, for example `Herculean.Account.Domain`.
- Folders inside a .NET project are PascalCase, because they are namespaces, for example `Exercises/CreateExercise`.
- Folders and files in the app are kebab-case, for example `features/workout/set-sheet.tsx`.

### C#

| What | Style | Example |
|---|---|---|
| Types, methods, properties | PascalCase | `WorkoutExercise` |
| Interfaces | `I` + PascalCase | `IWorkoutRepository` |
| Private fields | `_camelCase` | `_timeProvider` |
| Locals, parameters | camelCase | `workoutId` |
| Async methods | `Async` suffix | `SaveAsync` |
| Points in time | `Utc` suffix | `StartedAtUtc` |
| Namespaces | `Herculean.<Module>.<Layer>` | `Herculean.Training.Domain` |
| Slice files | `<UseCase><Part>` | `CreateExerciseHandler` |

Names are explicit: a field, parameter or local says what it holds, for example `userRepository`, `dbContext`, `normalizedEmail`. No abbreviations or one-letter names.

Type suffixes say what a type is for: `Request` comes into the API, `Response` goes out of it, `IntegrationEvent` and `Query` are Contracts between modules, and `IntegrationEventHandler` handles an integration event. There is no `Dto` suffix: inside a module, types are named for what they are.

### Database

- snake_case, set once per DbContext with `UseSnakeCaseNamingConvention()`.
- Tables are plural: `week_plan_days`.
- Enums are stored by name, for example `Metric`, so reordering an enum never changes saved data.
- Schemas are module names: `account`, `training`, `feedback`.

### API

We follow REST as closely as possible.

- **Routes** start with `/api/v1/`, followed by plural nouns in kebab-case, for example `/api/v1/week-plan-days`.
- **IDs** go in the path: `/api/v1/routines/{id}`. A child resource is nested under its parent: `/api/v1/workouts/{id}/exercises`.
- **Current user:** `me` stands for the signed-in user: `/api/v1/users/me`.
- **Filters** go in the query string: `/api/v1/days?from=2026-10-01&to=2026-10-31`.
- **Methods:**

  | Method | Meaning | Success |
  |---|---|---|
  | GET | Read | 200 |
  | POST | Create | 201, with a `Location` header. Sign in and refresh return 200, like an OAuth 2.0 token endpoint. Work that happens after the answer returns 202, for example sending a reset link. |
  | PUT | Replace a whole resource | 200 |
  | PATCH | Change some fields, as in JSON Merge Patch (RFC 7396). A field left out stays the same. No field can be cleared yet, so null also keeps it. | 200, with the whole resource |
  | DELETE | Delete | 204 |

  An action with nothing to return gives 204, for example `/complete`.

- **Actions:** when no resource fits, a short verb is added after the resource and called with POST, for example `/restore`, `/refresh`, `/complete`, `/confirm`. This is the exception, not the rule.
- **Errors** are Problem Details: 400 validation, 401 not signed in, 404 not found, 409 conflict. Every error has the same fields, as set out in [Errors](/architecture/backend#errors).
- **JSON** uses camelCase. Enum values are camelCase strings, for example `inProgress`. Numbers are JSON numbers, never strings.

### TypeScript

| What | Style | Example |
|---|---|---|
| Values, functions, hooks | camelCase | `useWorkout` |
| Components, types | PascalCase | `SetRow` |
| Files | kebab-case | `set-row.tsx` |

## Code style and build

### .NET

- `.slnx` solution file.
- `Directory.Build.props` for shared settings, `Directory.Packages.props` for package versions.
- `.editorconfig` with code style enforced in the build.
- Nullable reference types on. Warnings are errors.
- XML docs on every public type and member. The build fails without them. Other code has comments only to explain why.
- .NET analyzers at analysis level `latest-recommended`.
- Format with `dotnet format`.

### TypeScript

- TypeScript strict mode.
- ESLint flat config with `eslint-config-expo` and typescript-eslint `strict-type-checked` and `stylistic-type-checked`.
- Format with Prettier.
- Lint warnings fail.

## Git

- **Branches:** `<type>/<short-name>` in kebab-case, for example `feat/exercise-groups`.
- **Commits and PR titles:** [Conventional Commits](https://www.conventionalcommits.org), for example `feat: add exercise groups`. Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`.
- **Merging:** squash merge. The PR title becomes the commit on `main`. The branch is deleted after merging.
- **`main` is protected** by a ruleset: nobody pushes to it directly, every change comes through a PR, the `app`, `api`, `design` and `pr` jobs must pass, all conversations must be resolved, history stays linear, and it can't be force-pushed or deleted. Only the project owner merges.

## Pipeline

GitHub Actions runs `.github/workflows/` on every PR and on `main`. Third-party actions are pinned to a commit.

| Workflow | Job | Runs when | What it does |
|---|---|---|---|
| Checks | `changes` | Always | Works out which parts changed, so the other jobs run only for those |
| Checks | `app` | `api/`, `app/` or its workflow changes | Lint, format check, type check, API client up to date, tests with coverage |
| Checks | `api` | Same as `app` | Format check, build, OpenAPI document up to date, tests with coverage |
| Checks | `design` | `docs/design/` changes | Checks the design's screen IDs |
| PR rules | `pr` | A PR opens, is edited or gets a push | Checks the title and branch name, as set out in [Git](#git), and that it names its issue, as set out in [Work items](#work-items). Skipped for Dependabot's PRs |

A job that doesn't need to run is skipped, and a skipped job counts as passed. A new push to a PR stops the run it replaces. Coverage reports are kept for a day.

## Work items

Work items are GitHub issues, on the **Herculean** project board.

- **Milestone** `v1` holds the release.
- **Types, from big to small:** an **Epic** is a whole feature, as listed in [Scope and features](/product/scope#features). A **Story** is something a user can do, usually one PR. A **Task** is one step of a story, when it is big enough to split. Technical work that no user sees is a Task under an Epic, and the **Platform** epic holds the one-off ones. A **Bug** sits under the story or epic it belongs to. Smaller items are sub-issues of bigger ones.
- **Board:** an item starts in **Backlog**, moves to **Ready** once it is planned and its design is approved, to **In progress** when work starts, and to **In review** when its PR is open. Closing it or merging its PR moves it to **Done**. Epics stay off the columns.
- **Every PR names its issue** at the top of its description: `Closes #12`, or `Relates to #12` when the issue stays open or is already closed.
- **Issues 1 to 94** were moved from GitLab with their numbers, text and dates.

## Definition of done

A feature is done when:

1. Its screens match the design, checked by screen ID.
2. Its tests were written first and pass.
3. The guard tests pass.
4. The wiki is updated.
5. The checks pass.
6. The PR is merged.
