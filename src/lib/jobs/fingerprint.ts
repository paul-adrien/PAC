import crypto from 'node:crypto';

type FingerprintParts = {
  source: string;
  source_url: string;
  company: string;
  title: string;
  location: string | null;
};

const fpKey = (p: FingerprintParts) => {
  return ['v1', p.source, p.source_url, p.company, p.title, p.location ?? ''].join('|');
};

export function fingerprintJob(parts: FingerprintParts): string {
  const key = fpKey(parts);
  return crypto.createHash('sha256').update(key, 'utf8').digest('hex');
}
