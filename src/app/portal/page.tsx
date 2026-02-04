'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth/auth.store';
import { useApplicationsStore } from '@/lib/store/applications/applications.store';
import { useTranslation } from '@/lib/i18n';
import { ApplicationCard } from '../../components/applications/ApplicationCard';

export default function PortalPage() {
  const user = useAuthStore(s => s.user);
  const { t } = useTranslation();

  const apps = useApplicationsStore(s => s.applications);
  const loading = useApplicationsStore(s => s.loading);
  const error = useApplicationsStore(s => s.error);
  const fetchAll = useApplicationsStore(s => s.fetchAll);

  useEffect(() => {
    if (user?.id) {
      fetchAll(user.id);
    }
  }, [user]);

  return (
    <div className="mx-auto max-w-4xl">
      <section className="rounded-2xl border border-orange-200/60 bg-white/90 px-6 py-4 shadow-lg backdrop-blur">
        <h1 className="text-2xl font-semibold text-gray-900">{t('portal.page.myApplications')}</h1>
      </section>

      <section className="mt-6">
        {loading ? (
          <div className="rounded-2xl border border-orange-200/60 bg-white/90 px-6 py-8 shadow-lg backdrop-blur">
            <p className="text-sm text-gray-500">{t('common.loading')}</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-white/90 px-6 py-4 shadow-lg backdrop-blur">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : apps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-orange-300 bg-white/80 px-6 py-10 text-center shadow backdrop-blur">
            <p className="text-sm font-medium text-gray-700">{t('portal.page.emptyTitle')}</p>
            <p className="mt-1 text-sm text-gray-500">{t('portal.page.emptyHint')}</p>
            <Link
              href="/portal/new-application"
              className="mt-4 inline-block rounded-md bg-orange-900 px-4 py-2 text-sm font-medium text-white hover:bg-orange-800"
            >
              {t('portal.page.newApplication')}
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {apps.map(a => (
              <ApplicationCard key={a.id} application={a} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
