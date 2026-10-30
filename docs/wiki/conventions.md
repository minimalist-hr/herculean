---
title: Conventions
---

## How we work

- Every change goes on a branch and reaches `main` through a merge request (MR).
- The wiki is updated in the same MR as the change it describes.
- A design change is proposed and approved before it is built.
- Design issues are GitLab issues with the `design` label.
- Screens are named by ID, for example W10.
- Each fact is written once, in one place, and linked from elsewhere.

## Vocabulary

The terms in [Domain and entities](domain-and-entities#terms) are used unchanged in the app, API, database and docs.

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

### Database

- snake_case, set once per DbContext with `UseSnakeCaseNamingConvention()`.
- Tables are plural: `week_plan_days`.
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
  | PATCH | Change some fields | 200 |
  | DELETE | Delete | 204 |

- **Actions:** when no resource fits, a short verb is added after the resource and called with POST, for example `/restore`, `/refresh`, `/complete`, `/confirm`. This is the exception, not the rule.
- **Errors** are Problem Details: 400 validation, 401 not signed in, 404 not found, 409 conflict.
- **JSON** uses camelCase. Enum values are camelCase strings, for example `inProgress`.

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

| Job | Runs when | What it does |
|---|---|---|
| `api` | `api/` or the pipeline changes | Format check, build, tests |
| `app` | `app/` or the pipeline changes | Lint, format check, type check, tests |
| `mr-checks` | Every merge request | Checks the MR title and branch name, as set out in [Git](#git) |
| `wiki` | `docs/wiki/` changes on `main` | Copies `docs/wiki/` to the GitLab wiki |

The GitLab wiki is a copy. Edit `docs/wiki/` in the repo, never the GitLab wiki: the next copy overwrites it.

## Work items

- **Milestone** `v1` holds the release.
- **One issue per feature**, as listed in [Scope and features](scope-and-features#features).
- **Child tasks** inside a feature issue hold the work steps.
- **Labels:** `feature`, `bug`, `design`.
- **Templates:** issue templates (Feature, Bug, Design issue) are in `.gitlab/issue_templates/`. The MR template is in `.gitlab/merge_request_templates/`. It assigns a new MR to its author, makes the author the reviewer and sets the milestone to `v1`.

## Definition of done

A feature is done when:

1. Its screens match the design, checked by screen ID.
2. Its tests were written first and pass.
3. The guard tests pass.
4. The wiki is updated.
5. The pipeline is green.
6. The MR is merged.
