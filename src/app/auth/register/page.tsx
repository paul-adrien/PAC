'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthCard } from '@/components/auth/AuthCard';
import { useAuthStore } from '@/lib/store/auth/auth.store';
import { Input } from '@/components/ui/input';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from '@/lib/i18n';

const MIN_PASSWORD_LENGTH = 6;

type RegisterForm = {
  email: string;
  password: string;
  confirmPassword: string;
  lastName: string;
  firstName: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const register = useAuthStore(s => s.register);
  const loading = useAuthStore(s => s.loading);
  const error = useAuthStore(s => s.error);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    mode: 'onBlur',
  });

  const password = watch('password');

  const handleRegister = async (data: RegisterForm) => {
    const ok = await register(data.email, data.password, data.lastName, data.firstName);
    if (ok) router.push('/auth/login?confirmEmail=1');
  };

  return (
    <AuthCard title={t('auth.register.title')} subtitle={t('auth.register.subtitle')}>
      <form className="space-y-4" onSubmit={handleSubmit(handleRegister)}>
        <Controller
          control={control}
          name="email"
          render={({ field: { value, onChange } }) => (
            <Input type="email" placeholder={t('common.email')} value={value} onChange={onChange} />
          )}
        />

        <div>
          <Controller
            control={control}
            name="password"
            rules={{
              required: t('auth.register.passwordRequired'),
              minLength: {
                value: MIN_PASSWORD_LENGTH,
                message: t('auth.register.passwordMinLength', { min: MIN_PASSWORD_LENGTH }),
              },
            }}
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                type="password"
                placeholder={t('common.password')}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                aria-invalid={!!errors.password}
              />
            )}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <Controller
            control={control}
            name="confirmPassword"
            rules={{
              required: t('auth.register.confirmPasswordRequired'),
              validate: value => value === password || t('auth.register.passwordsMismatch'),
            }}
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                type="password"
                placeholder={t('auth.register.confirmPassword')}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                aria-invalid={!!errors.confirmPassword}
              />
            )}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Controller
          control={control}
          name="lastName"
          render={({ field: { value, onChange } }) => (
            <Input type="text" placeholder={t('auth.register.lastName')} value={value} onChange={onChange} />
          )}
        />

        <Controller
          control={control}
          name="firstName"
          render={({ field: { value, onChange } }) => (
            <Input type="text" placeholder={t('auth.register.firstName')} value={value} onChange={onChange} />
          )}
        />

        <button
          disabled={loading}
          className="w-full rounded-md bg-orange-900 hover:bg-orange-800 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? '...' : t('auth.register.submit')}
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        {t('auth.register.hasAccount')}{' '}
        <Link href="/auth/login" className="font-medium text-orange-800 hover:underline">
          {t('auth.register.signIn')}
        </Link>
      </p>
    </AuthCard>
  );
}
