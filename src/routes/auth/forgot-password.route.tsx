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

const schema = z.object({ email: z.email('Введіть коректний email.') });
type FormValues = z.infer<typeof schema>;
export function ForgotPasswordRoute() {
  const [message, setMessage] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const onSubmit = handleSubmit(async ({ email }) => {
    setFormError(undefined);
    try {
      const { error } = await authService.sendPasswordReset(email);
      if (error) throw error;
      setMessage('Якщо акаунт існує, ми надіслали лист для відновлення.');
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    }
  });
  return (
    <AuthPageShell
      description="Надішлемо безпечне посилання на вашу пошту."
      title="Відновлення пароля"
    >
      <form className="grid gap-5" onSubmit={(event) => void onSubmit(event)}>
        <Input
          error={errors.email?.message}
          id="recovery-email"
          label="Email"
          {...register('email')}
        />
        {formError && (
          <p className="text-sm text-danger" role="alert">
            {formError}
          </p>
        )}
        {message && (
          <p className="text-sm text-success" role="status">
            {message}
          </p>
        )}
        <Button disabled={isSubmitting} type="submit">
          Надіслати посилання
        </Button>
      </form>
      <Link className="mt-6 inline-block text-sm text-accent hover:underline" to="/login">
        Повернутися до входу
      </Link>
    </AuthPageShell>
  );
}
