import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthPageShell } from '@/features/auth/AuthPageShell';
import { getAuthErrorMessage } from '@/features/auth/auth-errors';
import { authService } from '@/features/auth/auth-service';
import { useAuth } from '@/features/auth/AuthProvider';

const schema = z.object({
  displayName: z.string().trim().min(2, 'Мінімум 2 символи.').max(60),
  email: z.email('Введіть коректний email.'),
  password: z
    .string()
    .min(8, 'Мінімум 8 символів.')
    .regex(/[A-ZА-ЯІЇЄ]/, 'Додайте велику літеру.')
    .regex(/[0-9]/, 'Додайте цифру.'),
});
type FormValues = z.infer<typeof schema>;
export function RegisterRoute() {
  const { status } = useAuth();
  const [message, setMessage] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: '', email: '', password: '' },
  });
  const onSubmit = handleSubmit(async (values) => {
    setFormError(undefined);
    try {
      const { error } = await authService.signUp(values.email, values.password, values.displayName);
      if (error) throw error;
      setMessage('Перевірте пошту та підтвердьте реєстрацію.');
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    }
  });
  return (
    <AuthPageShell
      description="Створіть профіль і зберігайте прогрес між пристроями."
      title="Створити акаунт"
    >
      <form className="grid gap-5" onSubmit={(event) => void onSubmit(event)}>
        <Input
          error={errors.displayName?.message}
          id="displayName"
          label="Ім’я профілю"
          {...register('displayName')}
        />
        <Input
          autoComplete="email"
          error={errors.email?.message}
          id="register-email"
          label="Email"
          {...register('email')}
        />
        <Input
          autoComplete="new-password"
          error={errors.password?.message}
          hint="8+ символів, велика літера та цифра"
          id="register-password"
          label="Пароль"
          type="password"
          {...register('password')}
        />
        {formError && (
          <p className="text-sm text-danger" role="alert">
            {formError}
          </p>
        )}
        {message && (
          <p className="rounded-md bg-success/15 p-3 text-sm text-success" role="status">
            {message}
          </p>
        )}
        <Button disabled={isSubmitting || status === 'unconfigured'} type="submit">
          {isSubmitting ? 'Створюємо…' : 'Зареєструватися'}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted">
        Уже маєте акаунт?{' '}
        <Link className="text-accent hover:underline" to="/login">
          Увійти
        </Link>
      </p>
    </AuthPageShell>
  );
}
