import type { JobDetailData } from '../../shared/types';

type JobPostingLd = {
  '@type'?: string;
  title?: string;
  description?: string;
  employmentType?: string;
  jobLocationType?: string;
  datePosted?: string;
  industry?: string;
  baseSalary?: {
    currency?: string;
    value?: {
      minValue?: number;
      maxValue?: number;
      value?: number;
      unitText?: string;
    };
  };
  experienceRequirements?: {
    monthsOfExperience?: number;
  };
};

const EMPLOYMENT_TYPE_FR: Record<string, string> = {
  FULL_TIME: 'Temps plein',
  PART_TIME: 'Temps partiel',
  CONTRACTOR: 'Freelance',
  TEMPORARY: 'CDD',
  INTERN: 'Stage',
  PER_DIEM: 'Intérim',
  VOLUNTEER: 'Bénévolat',
  OTHER: 'Autre',
};

const WORK_MODE_FR: Record<string, string> = {
  TELECOMMUTE: 'Télétravail',
};

function readJobPostingLd(): JobPostingLd | null {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const s of Array.from(scripts)) {
    try {
      const data = JSON.parse(s.textContent ?? '');
      const candidates = Array.isArray(data) ? data : [data];
      for (const c of candidates) {
        if (c && typeof c === 'object' && c['@type'] === 'JobPosting') return c as JobPostingLd;
      }
    } catch {
      // ignore malformed JSON-LD
    }
  }
  return null;
}

function stripHtml(html: string | undefined): string | null {
  if (!html) return null;
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const text = tmp.textContent ?? '';
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length > 0 ? cleaned : null;
}

function formatSalary(ld: JobPostingLd): string | null {
  const bs = ld.baseSalary;
  if (!bs?.value) return null;
  const { minValue, maxValue, value, unitText } = bs.value;
  const currency = bs.currency ?? '';
  const period = unitText === 'YEARLY' ? '/an' : unitText === 'MONTHLY' ? '/mois' : '';

  const fmt = (n: number) =>
    n >= 1000 && n % 1000 === 0 ? `${n / 1000}K` : n.toLocaleString('fr-FR');

  if (typeof minValue === 'number' && typeof maxValue === 'number') {
    return `${fmt(minValue)}–${fmt(maxValue)} ${currency}${period}`.trim();
  }
  if (typeof value === 'number') return `${fmt(value)} ${currency}${period}`.trim();
  return null;
}

function formatEmploymentType(ld: JobPostingLd): string | null {
  const fromDom = readDomEmploymentChip();
  const fromLd = ld.employmentType
    ? (EMPLOYMENT_TYPE_FR[ld.employmentType] ?? ld.employmentType)
    : null;
  const base = fromDom ?? fromLd;

  const remoteFromLd = ld.jobLocationType ? (WORK_MODE_FR[ld.jobLocationType] ?? null) : null;
  const remoteFromDom = readDomRemoteChip();
  const remote = remoteFromDom ?? remoteFromLd;

  if (base && remote) return `${base} · ${remote}`;
  return base ?? remote;
}

function readDomEmploymentChip(): string | null {
  const block = document.querySelector('[data-testid="job-metadata-block"]');
  if (!block) return null;
  const text = block.textContent ?? '';
  const m = text.match(/\b(CDI|CDD|Stage|Alternance|Freelance|Intérim|Apprentissage)\b/);
  return m ? m[1] : null;
}

function readDomRemoteChip(): string | null {
  const block = document.querySelector('[data-testid="job-metadata-block"]');
  if (!block) return null;
  const text = block.textContent ?? '';
  const m = text.match(/Télétravail(?:\s+(?:total|partiel|fréquent|occasionnel|non autorisé))?/i);
  return m ? m[0] : null;
}

function formatSeniority(ld: JobPostingLd): string | null {
  const months = ld.experienceRequirements?.monthsOfExperience;
  if (typeof months !== 'number' || months <= 0) return null;
  if (months < 12) return `${months} mois d'expérience`;
  const years = Math.round(months / 12);
  return `${years} an${years > 1 ? 's' : ''} d'expérience`;
}

function readDomDescription(): string | null {
  const node = document.querySelector('[data-testid="job-section-description"]');
  if (!node) return null;
  const text = (node as HTMLElement).innerText ?? node.textContent ?? '';
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length > 0 ? cleaned : null;
}

export function canonicalWttjDetailUrl(href: string): string | null {
  try {
    const u = new URL(href);
    if (u.hostname !== 'www.welcometothejungle.com') return null;
    const m = u.pathname.match(/^\/fr\/companies\/([^/]+)\/jobs\/([^/]+)/);
    if (!m) return null;
    return `https://www.welcometothejungle.com/fr/companies/${m[1]}/jobs/${m[2]}`;
  } catch {
    return null;
  }
}

export function scrapeWttjJobDetail(): JobDetailData {
  const ld = readJobPostingLd();
  const sourceUrl = canonicalWttjDetailUrl(location.href) ?? location.href;

  const description = (ld && stripHtml(ld.description)) ?? readDomDescription();
  const employmentType = ld ? formatEmploymentType(ld) : readDomEmploymentChip();
  const salary = ld ? formatSalary(ld) : null;
  const postedAt = ld?.datePosted ?? null;
  const seniorityLevel = ld ? formatSeniority(ld) : null;
  const industry = ld?.industry ?? null;

  return {
    sourceUrl,
    description,
    employmentType,
    seniorityLevel,
    industry,
    skills: [],
    salary,
    applicants: null,
    postedAt,
  };
}
