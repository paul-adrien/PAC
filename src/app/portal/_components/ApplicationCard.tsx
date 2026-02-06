'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import type { Application } from '@/lib/domain';
import { EditApplicationForm } from './EditApplicationForm';
import { ApplicationCardContent } from './ApplicationCardContent';

type Props = {
  application: Application;
  onRequestDelete?: (application: Application) => void;
};

export function ApplicationCard(props: Props) {
  const { application: a, onRequestDelete } = props;
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);

  const handleEdit = () => {
    setEditing(true);
  };

  const handleDeleteClick = () => {
    if (onRequestDelete) {
      onRequestDelete(a);
      return;
    }
  };

  return (
    <li>
      <div className="w-full rounded-2xl border border-orange-200/60 bg-white/90 p-4 shadow-lg backdrop-blur">
        {editing ? (
          <EditApplicationForm
            application={a}
            onCancel={() => setEditing(false)}
            onSaved={() => setEditing(false)}
          />
        ) : (
          <div className="flex items-start justify-between gap-4">
            <ApplicationCardContent application={a} />

            <div className="flex shrink-0 items-end gap-2">
              <button
                type="button"
                onClick={handleEdit}
                className="rounded-md border border-orange-200 bg-white px-3 py-1 text-xs font-medium text-orange-700 shadow-sm hover:border-orange-300 hover:bg-orange-50"
              >
                {t('common.edit', { defaultValue: 'Edit' })}
              </button>
              <button
                type="button"
                onClick={handleDeleteClick}
                className="rounded-md border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-700 shadow-sm hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t('common.delete', { defaultValue: 'Delete' })}
              </button>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}
