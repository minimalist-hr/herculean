import { createAccountSchema } from './create-account-schema';
import { newPasswordSchema } from './new-password-schema';

const tooLong = 'a'.repeat(129);
const longest = 'a'.repeat(128);

test('creating an account refuses a password over 128 characters', () => {
  const result = createAccountSchema.safeParse({
    email: 'filip@example.com',
    password: tooLong,
    repeatPassword: tooLong,
  });

  expect(result.error?.issues[0]?.message).toBe('Use at most 128 characters.');
});

test('a new password can be 128 characters but not more', () => {
  expect(
    newPasswordSchema.safeParse({ password: longest, repeatPassword: longest })
      .success,
  ).toBe(true);
  expect(
    newPasswordSchema.safeParse({ password: tooLong, repeatPassword: tooLong })
      .error?.issues[0]?.message,
  ).toBe('Use at most 128 characters.');
});
