import { ApiProblemError, toApiError, toFormErrors } from './problem';

const validation = {
  type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
  title: 'Bad Request',
  status: 400,
  detail: 'One or more fields are not valid.',
  code: 'validation',
  errors: {
    email: ['Enter an email.', 'Too long.'],
    timeZone: ['Not a time zone.'],
  },
  traceId: '00-1',
};

const conflict = {
  type: 'https://tools.ietf.org/html/rfc9110#section-15.5.10',
  title: 'Conflict',
  status: 409,
  detail: 'An account with this email already exists.',
  code: 'user.email_taken',
  traceId: '00-2',
};

test('field errors go to the fields the form shows, first message each', () => {
  expect(
    toFormErrors(
      new ApiProblemError({
        ...validation,
        errors: { email: validation.errors.email },
      }),
      ['email', 'password'],
    ),
  ).toEqual({ fields: { email: 'Enter an email.' }, general: false });
});

test('a field error the form does not show makes it a general error', () => {
  expect(
    toFormErrors(new ApiProblemError(validation), ['email', 'password']),
  ).toEqual({
    fields: { email: 'Enter an email.' },
    general: true,
  });
});

test('a code tied to a field shows its detail under that field', () => {
  expect(
    toFormErrors(new ApiProblemError(conflict), ['email'], {
      'user.email_taken': 'email',
    }),
  ).toEqual({
    fields: { email: 'An account with this email already exists.' },
    general: false,
  });
});

test('a code tied to no field is a general error', () => {
  expect(toFormErrors(new ApiProblemError(conflict), ['email'])).toEqual({
    fields: {},
    general: true,
  });
});

test('an API error body with Problem Details becomes an ApiProblemError', () => {
  expect(toApiError(conflict)).toEqual(new ApiProblemError(conflict));
});

test('an API error body without Problem Details becomes a plain error', () => {
  const error = toApiError('Bad Gateway');

  expect(error).not.toBeInstanceOf(ApiProblemError);
  expect(error).toBeInstanceOf(Error);
});

test('an error that is not from the API, like no connection, is a general error', () => {
  expect(
    toFormErrors(new TypeError('Network request failed'), ['email']),
  ).toEqual({ fields: {}, general: true });
});
