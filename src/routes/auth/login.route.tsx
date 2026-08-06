import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthPageShell } from '@/features/auth/AuthPageShell';
import { getAuthErrorMessage } from '@/features/auth/auth-errors';
import { authService } from '@/features/auth/auth-service';
import { useAuth } from '@/features/auth/AuthProvider';

const schema = z.object({
  email: z.email('Введіть коректний email.'),
  password: z.string().min(8, 'Мінімум 8 символів.'),
});
type FormValues = z.infer<typeof schema>;

export function LoginRoute() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });
  if (auth.status === 'authenticated') return <Navigate replace to="/browse" />;
  const onSubmit = handleSubmit(async (values) => {
    setFormError(undefined);
    try {
      const { error } = await authService.signIn(values.email, values.password);
      if (error) throw error;
      const target = (location.state as { from?: string } | null)?.from ?? '/browse';
      await navigate(target, { replace: true });
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    }
  });
  return (
    <AuthPageShell description="Увійдіть, щоб продовжити перегляд." title="З поверненням">
      <form className="grid gap-5" onSubmit={(event) => void onSubmit(event)}>
        <Input
          autoComplete="email"
          error={errors.email?.message}
          id="email"
          label="Email"
          {...register('email')}
        />
        <Input
          autoComplete="current-password"
          error={errors.password?.message}
          id="password"
          label="Пароль"
          type="password"
          {...register('password')}
        />
        {formError && (
          <p className="text-sm text-danger" role="alert">
            {formError}
          </p>
        )}
        <div className="flex justify-end">
          <Link className="text-sm text-accent hover:underline" to="/forgot-password">
            Забули пароль?
          </Link>
        </div>
        <Button disabled={isSubmitting || auth.status === 'unconfigured'} type="submit">
          {isSubmitting ? 'Входимо…' : 'Увійти'}
        </Button>
        {auth.status === 'unconfigured' && (
          <p className="text-sm text-warning">
            Додайте Supabase URL і publishable key у `.env.local`.
          </p>
        )}
      </form>
      <p className="mt-6 text-sm text-muted">
        Ще немає акаунта?{' '}
        <Link className="text-accent hover:underline" to="/register">
          Зареєструватися
        </Link>
      </p>
    </AuthPageShell>
  );
}
