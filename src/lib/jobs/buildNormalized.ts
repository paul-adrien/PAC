import { JobNormalizedSchema, type JobInput, type JobNormalized } from './schema';
import {
  normalizeCompany,
  normalizeLocation,
  normalizeSource,
  normalizeTitle,
  normalizeUrl,
} from './normalize';
import { fingerprintJob } from './fingerprint';

type ValidJobInput = JobInput & { title: string; company: string };

export function buildNormalized(input: ValidJobInput): JobNormalized {
  const title = normalizeTitle(input.title);
  const company = normalizeCompany(input.company);
  const location = normalizeLocation(input.location);
  const source = normalizeSource(input.source);
  const source_url = normalizeUrl(input.sourceUrl);

  const fingerprint = fingerprintJob({
    source,
    source_url,
    company,
    title,
    location,
  });

  const scraped_at = input.scrapedAt ? new Date(input.scrapedAt).toISOString() : null;

  return JobNormalizedSchema.parse({
    title,
    company,
    location,
    source,
    source_url,
    scraped_at,
    fingerprint,
    raw: input,
  });
}
