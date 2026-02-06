'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/auth/auth.store';
import { useApplicationsStore } from '@/lib/store/applications/applications.store';
import { useTranslation } from '@/lib/i18n';
import { ApplicationCard } from '../../components/applications/ApplicationCard';
import { Text } from '@/components/ui/text';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function PortalPage() {
  const user = useAuthStore(s => s.user);
  const { t } = useTranslation();

  const apps = useApplicationsStore(s => s.applications);
  const loading = useApplicationsStore(s => s.loading);
  const error = useApplicationsStore(s => s.error);
  const fetchAll = useApplicationsStore(s => s.fetchAll);
   const removeApplication = useApplicationsStore(s => s.remove);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const appToDelete = deleteId ? apps.find(a => a.id === deleteId) ?? null : null;

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await removeApplication(deleteId as any);
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchAll(user.id);
    }
  }, [user]);

  return (
    <div className="mx-auto max-w-4xl">
      <section className="mt-6">
        {loading ? (
          <div className="rounded-2xl border border-orange-200/60 bg-white/90 px-6 py-8 shadow-lg backdrop-blur">
            <Text variant="muted">{t('common.loading')}</Text>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-white/90 px-6 py-4 shadow-lg backdrop-blur">
            <Text variant="danger">{error}</Text>
          </div>
        ) : apps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-orange-300 bg-white/80 px-6 py-10 text-center shadow backdrop-blur">
            <Text variant="sm" className="font-medium text-gray-700">
              {t('portal.page.emptyTitle')}
            </Text>
            <Text variant="sm" className="mt-1 text-gray-500">
              {t('portal.page.emptyHint')}
            </Text>
            <Link
              href="/portal/new-application"
              className="mt-4 inline-block rounded-md bg-orange-900 px-4 py-2 text-sm font-medium text-white hover:bg-orange-800"
            >
              {t('portal.page.newApplication')}
            </Link>
          </div>
        ) : (
          <>
            <ul className="space-y-3">
              {apps.map(a => (
                <ApplicationCard
                  key={a.id}
                  application={a}
                  onRequestDelete={app => setDeleteId(app.id as any)}
                />
              ))}
            </ul>

            <ConfirmDialog
              open={!!appToDelete}
              title={t('portal.card.confirmDeleteTitle', {
                defaultValue: 'Delete this application?',
              })}
              message={t('portal.card.confirmDelete', {
                defaultValue:
                  'This action cannot be undone. Do you really want to delete this application?',
              })}
              confirmLabel={t('common.delete', { defaultValue: 'Delete' })}
              cancelLabel={t('common.cancel', { defaultValue: 'Cancel' })}
              loading={deleting}
              onConfirm={handleConfirmDelete}
              onCancel={() => setDeleteId(null)}
            />
          </>
        )}
      </section>
    </div>
  );
}
