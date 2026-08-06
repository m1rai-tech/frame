import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthPageShell } from '@/features/auth/AuthPageShell';
import { getAuthErrorMessage } from '@/features/auth/auth-errors';
import { authService } from '@/features/auth/auth-service';

const schema = z
  .object({ password: z.string().min(8, 'Мінімум 8 символів.'), confirmation: z.string() })
  .refine((value) => value.password === value.confirmation, {
    path: ['confirmation'],
    message: 'Паролі не збігаються.',
  });
type FormValues = z.infer<typeof schema>;
export function ResetPasswordRoute() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const onSubmit = handleSubmit(async ({ password }) => {
    try {
      const { error } = await authService.updatePassword(password);
      if (error) throw error;
      await navigate('/browse', { replace: true });
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    }
  });
  return (
    <AuthPageShell description="Вигадайте новий надійний пароль." title="Новий пароль">
      <form className="grid gap-5" onSubmit={(event) => void onSubmit(event)}>
        <Input
          autoComplete="new-password"
          error={errors.password?.message}
          id="new-password"
          label="Новий пароль"
          type="password"
          {...register('password')}
        />
        <Input
          autoComplete="new-password"
          error={errors.confirmation?.message}
          id="password-confirmation"
          label="Повторіть пароль"
          type="password"
          {...register('confirmation')}
        />
        {formError && (
          <p className="text-sm text-danger" role="alert">
            {formError}
          </p>
        )}
        <Button disabled={isSubmitting} type="submit">
          Зберегти пароль
        </Button>
      </form>
    </AuthPageShell>
  );
}
