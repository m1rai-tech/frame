const knownErrors: Array<[RegExp, string]> = [
  [/invalid login credentials/i, 'Неправильний email або пароль.'],
  [/email not confirmed/i, 'Підтвердьте email за посиланням у листі.'],
  [/user already registered/i, 'Акаунт із таким email уже існує.'],
  [/password should be at least/i, 'Пароль має містити щонайменше 8 символів.'],
  [/email rate limit exceeded/i, 'Забагато листів. Спробуйте трохи пізніше.'],
  [/over_email_send_rate_limit/i, 'Забагато листів. Спробуйте трохи пізніше.'],
];

export function getAuthErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    knownErrors.find(([pattern]) => pattern.test(message))?.[1] ??
    'Не вдалося виконати дію. Спробуйте ще раз.'
  );
}
