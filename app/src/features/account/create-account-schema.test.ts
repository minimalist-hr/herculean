import { createAccountSchema } from './create-account-schema';

const valid = {
  email: 'filip@example.com',
  password: 'password',
  repeatPassword: 'password',
};

function errorsFor(values: typeof valid) {
  const result = createAccountSchema.safeParse(values);
  return result.success
    ? {}
    : Object.fromEntries(
        result.error.issues.map((issue) => [
          issue.path.join('.'),
          issue.message,
        ]),
      );
}

test('valid values pass', () => {
  expect(errorsFor(valid)).toEqual({});
});

test('email must be an email', () => {
  expect(errorsFor({ ...valid, email: 'filip' })).toEqual({
    email: 'Enter a valid email.',
  });
});

test('password needs 8 characters', () => {
  expect(
    errorsFor({ ...valid, password: 'passwor', repeatPassword: 'passwor' }),
  ).toEqual({
    password: 'At least 8 characters.',
  });
});

test('the passwords must match', () => {
  expect(errorsFor({ ...valid, repeatPassword: 'password2' })).toEqual({
    repeatPassword: 'The passwords don’t match.',
  });
});
