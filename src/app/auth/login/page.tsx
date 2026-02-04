'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthCard } from '@/components/auth/AuthCard';
import { useAuthStore } from '@/lib/store/auth/auth.store';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const showConfirmEmail = searchParams.get('confirmEmail') === '1';

  const login = useAuthStore(s => s.login);
  const loading = useAuthStore(s => s.loading);
  const error = useAuthStore(s => s.error);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) router.push('/portal');
  };

  return (
    <AuthCard title={t('auth.login.title')} subtitle={t('auth.login.subtitle')}>
      {showConfirmEmail && (
        <p
          className="mb-4 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800"
          role="status"
        >
          {t('auth.login.confirmEmailMessage')}
        </p>
      )}
      <form className="space-y-4" onSubmit={handleLogin}>
        <Input
          type="email"
          placeholder={t('common.email')}
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <Input
          type="password"
          placeholder={t('common.password')}
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button
          disabled={loading}
          className="w-full rounded-md bg-orange-900 hover:bg-orange-800 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? '...' : t('auth.login.submit')}
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        {t('auth.login.noAccount')}{' '}
        <Link href="/auth/register" className="font-medium text-orange-800 hover:underline">
          {t('auth.login.createAccount')}
        </Link>
      </p>
    </AuthCard>
  );
}
