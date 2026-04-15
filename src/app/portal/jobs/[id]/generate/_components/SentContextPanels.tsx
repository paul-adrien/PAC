import { Text } from '@/components/ui/text';

type JobSummary = {
  title: string;
  company: string;
  location: string | null;
  details: { description?: string; skills?: string[] } | null;
};

interface Props {
  readonly job: JobSummary | null;
  readonly profile: string;
}

export function SentContextPanels({ job, profile }: Props) {
  return (
    <div className="mt-4 space-y-3">
      <details className="rounded-md border border-orange-200 bg-orange-50/60">
        <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-wide text-orange-900">
          Profil envoyé
        </summary>
        <pre className="max-h-48 overflow-auto whitespace-pre-wrap border-t border-orange-200 px-3 py-2 text-xs text-gray-700">
          {profile || '— (aucun profil renseigné)'}
        </pre>
      </details>
      <details className="rounded-md border border-orange-200 bg-orange-50/60">
        <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-wide text-orange-900">
          Offre envoyée
        </summary>
        <div className="max-h-64 overflow-auto border-t border-orange-200 px-3 py-2">
          <Text variant="xs"><span className="font-semibold">Titre :</span> {job?.title ?? '—'}</Text>
          <Text variant="xs"><span className="font-semibold">Entreprise :</span> {job?.company ?? '—'}</Text>
          <Text variant="xs"><span className="font-semibold">Lieu :</span> {job?.location ?? '—'}</Text>
          <Text variant="xs" className="mt-2 font-semibold">Description :</Text>
          <pre className="whitespace-pre-wrap text-xs text-gray-700">{job?.details?.description ?? '—'}</pre>
          <Text variant="xs" className="mt-2 font-semibold">Compétences :</Text>
          <Text variant="xs">{job?.details?.skills?.join(', ') || '—'}</Text>
        </div>
      </details>
    </div>
  );
}
