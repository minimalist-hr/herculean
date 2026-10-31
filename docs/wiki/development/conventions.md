---
title: Conventions
---

## How we work

- Every change goes on a branch and reaches `main` through a merge request (MR).
- The wiki is updated in the same MR as the change it describes.
- A new wiki page is listed both on [Home](/home) and in `_sidebar.md`.
- A design change is proposed and approved before it is built.
- Design issues are GitLab issues with the `design` label.
- Screens are named by ID, for example W10.
- Each fact is written once, in one place, and linked from elsewhere.

## Vocabulary

The terms in [Domain and entities](/product/domain#terms) are used unchanged in the app, API, database and docs.

## Naming

### Folders

- Repo-level folders are lowercase: `api`, `app`, `aspire`, `docs`, `src`, `tests`, `modules`, `account`, `training`.
- A .NET project folder has the project's name, for example `Herculean.Account.Domain`.
- Folders inside a .NET project are PascalCase, because they are namespaces, for example `Exercises/CreateExercise`.
- Folders and files in the app are kebab-case, for example `features/logging/set-row.tsx`.

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
- Schemas are module names: `account`, `training`.

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
  | POST | Create | 201, with a `Location` header |
  | PUT | Replace a whole resource | 200 |
  | PATCH | Change some fields, as in JSON Merge Patch (RFC 7396). A field left out stays the same. No field can be cleared yet, so null also keeps it. | 200, with the whole resource |
  | DELETE | Delete | 204 |

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
- **Commits and MR titles:** [Conventional Commits](https://www.conventionalcommits.org), for example `feat: add exercise groups`. Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`.
- **Merging:** squash merge. The MR title becomes the commit on `main`. The branch is deleted after merging.
- **`main` is protected:** nobody pushes to it directly. The pipeline must pass and all threads must be resolved. Only the project owner merges.

## Pipeline

GitLab CI runs `.gitlab-ci.yml` on every merge request and on `main`.

| Stage | Job | Runs when | What it does |
|---|---|---|---|
| check | `app` | `api/`, `app/` or the pipeline changes | Lint, format check, type check, API client up to date, tests with coverage |
| check | `api` | Same as `app` | Format check, build, OpenAPI document up to date, tests with coverage |
| check | `mr` | Every merge request | Checks the MR title and branch name, as set out in [Git](#git), and that it names its issue, as set out in [Work items](#work-items) |
| analyze | `sonarqube` | After `app` and `api` on `main`. Started by hand on merge requests. | SonarQube Cloud analysis of the API and the app. A failed quality gate fails the pipeline on `main`. |
| deploy | `wiki` | `docs/wiki/` changes on `main` | Copies `docs/wiki/` to the GitLab wiki |

The GitLab wiki is a copy. Edit `docs/wiki/` in the repo, never the GitLab wiki: the next copy overwrites it.

## Work items

- **Milestone** `v1` holds the release.
- **One issue per flow** of a feature, app and API together. Features are listed in [Scope and features](/product/scope#features).
- **Labels:** each issue has one type: `feature`, `bug`, `design` or `chore`. An issue about one feature also has its feature label, numbered as in [Scope and features](/product/scope#features): `1-account` to `7-settings`.
- **In progress:** the issue being worked on has the `in progress` label, which puts it in that list on the issue board. Closing the issue takes it off the list.
- **Every MR names its issue** at the top of its description: `Closes #12`, or `Relates to #12` when the issue stays open or is already closed. The `mr` job checks this. After fixing the description, retry the job.
- **Templates:** issue templates (Feature, Bug, Design issue) are in `.gitlab/issue_templates/`. Each assigns a new issue to its author. The MR template is in `.gitlab/merge_request_templates/`. It assigns a new MR to its author, makes the author the reviewer and sets the milestone to `v1`.

## Definition of done

A feature is done when:

1. Its screens match the design, checked by screen ID.
2. Its tests were written first and pass.
3. The guard tests pass.
4. The wiki is updated.
5. The pipeline is green.
6. The MR is merged.
