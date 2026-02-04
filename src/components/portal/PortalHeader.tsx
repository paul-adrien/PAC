'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth/auth.store';
import { useTranslation } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const navItems = [
  { href: '/portal', labelKey: 'portal.header.myApplications' as const },
  { href: '/portal/new-application', labelKey: 'portal.header.newApplication' as const },
] as const;

export function PortalHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const logout = useAuthStore(s => s.logout);

  const handleLogout = async () => {
    await logout(router);
  };

  return (
    <header className="mx-auto mb-6 flex max-w-4xl flex-wrap items-center justify-between gap-4 rounded-2xl border border-orange-200/60 bg-white/90 px-6 py-4 shadow-lg backdrop-blur">
      <Link href="/portal" className="text-xl font-semibold text-gray-900 hover:text-orange-800">
        {t('portal.header.appName')}
      </Link>

      <nav className="flex items-center gap-1" aria-label={t('portal.header.navLabel')}>
        {navItems.map(({ href, labelKey }) => {
          const isActive = pathname === href || (href !== '/portal' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-orange-100 text-orange-900'
                  : 'text-gray-600 hover:bg-orange-50 hover:text-orange-800'
              }`}
            >
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:border-orange-400 cursor-pointer"
        >
          {t('portal.header.logout')}
        </button>
      </div>
    </header>
  );
}
