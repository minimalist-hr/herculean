import type { components } from './schema';

/** Every error the API returns has this shape (Problem Details, RFC 9457). */
export type Problem = components['schemas']['ProblemDetails'];

/** An error response from the API. */
export class ApiProblemError extends Error {
  constructor(readonly problem: Problem) {
    super(problem.detail);
    this.name = 'ApiProblemError';
  }
}

/** Turns the error part of an API call into an error to throw: Problem Details when the API sent them. */
export function toApiError(error: unknown): Error {
  return isProblem(error)
    ? new ApiProblemError(error)
    : new Error('The API answered with an error it did not describe.');
}

function isProblem(value: unknown): value is Problem {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'status' in value
  );
}

/** Errors for a form: one message per field, and whether a general error shows above the actions. */
export interface FormErrors<Field extends string> {
  fields: Partial<Record<Field, string>>;
  general: boolean;
}

/**
 * Sorts any error from a submit into the form's fields and its general error.
 * @param fieldNames The fields the form shows, named as in the request.
 * @param codeFields Error codes that belong under a field, for example `user.email_taken` under `email`.
 */
export function toFormErrors<Field extends string>(
  error: unknown,
  fieldNames: readonly Field[],
  codeFields: Partial<Record<string, Field>> = {},
): FormErrors<Field> {
  if (!(error instanceof ApiProblemError)) {
    return { fields: {}, general: true };
  }

  const { problem } = error;
  const codeField = codeFields[problem.code];
  if (codeField !== undefined) {
    return {
      fields: { [codeField]: problem.detail } as Partial<Record<Field, string>>,
      general: false,
    };
  }

  const fields: Partial<Record<Field, string>> = {};
  let general = problem.errors === undefined;
  for (const [name, messages] of Object.entries(problem.errors ?? {})) {
    if (isField(name, fieldNames)) {
      fields[name] = messages[0];
    } else {
      general = true;
    }
  }

  return { fields, general };
}

function isField<Field extends string>(
  name: string,
  fieldNames: readonly Field[],
): name is Field {
  return (fieldNames as readonly string[]).includes(name);
}
