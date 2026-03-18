import type { JobDetailData } from '../../shared/types';

function getCanonicalUrl(): string {
  const m = location.pathname.match(/\/jobs\/view\/(\d+)/);
  if (m?.[1]) return `https://www.linkedin.com/jobs/view/${m[1]}/`;
  return location.href;
}

function parseBodyText(): JobDetailData {
  const fullText = document.body.innerText;

  let postedAt: string | null = null;
  let applicants: string | null = null;
  const metaMatch = fullText.match(/·\s*(il y a [^·\n]+?)\s*·\s*(\d+\s*candidats?)/i)
    || fullText.match(/·\s*((?:\d+\s*(?:day|week|month|hour|minute)s?\s*ago))\s*·\s*(\d+\s*applicants?)/i);

  if (metaMatch) {
    postedAt = metaMatch[1].trim();
    applicants = metaMatch[2].trim();
  } else {
    const postedMatch = fullText.match(/il y a [^\n·]{3,30}/i) || fullText.match(/\d+\s*(?:day|week|month|hour)s?\s*ago/i);
    if (postedMatch) postedAt = postedMatch[0].trim();

    const applicantsMatch = fullText.match(/(\d+\s*candidats?)/i) || fullText.match(/(\d+\s*applicants?)/i);
    if (applicantsMatch) applicants = applicantsMatch[1].trim();
  }

  let employmentType: string | null = null;
  const typePatterns = [
    /\b(Temps plein|Temps partiel|Full-time|Part-time|CDI|CDD|Freelance|Stage|Intérim|Alternance|Internship|Contract)\b/i,
  ];
  for (const p of typePatterns) {
    const m = fullText.match(p);
    if (m) { employmentType = m[1]; break; }
  }

  let workMode: string | null = null;
  const modeMatch = fullText.match(/\b(Sur site|Hybride|À distance|Remote|On-site|Hybrid)\b/i);
  if (modeMatch) workMode = modeMatch[1];

  if (employmentType && workMode) {
    employmentType = `${employmentType} · ${workMode}`;
  } else if (workMode && !employmentType) {
    employmentType = workMode;
  }

  let seniorityLevel: string | null = null;
  const senioritySection = fullText.match(/Niveau d['']ancienneté\s*\n\s*(.+)/i)
    || fullText.match(/Seniority level\s*\n\s*(.+)/i);
  if (senioritySection) {
    seniorityLevel = senioritySection[1].trim();
  }

  let description: string | null = null;
  const descMarkers = [
    'propos de l\u2019offre d\u2019emploi',
    'propos de l\'offre d\'emploi',
    'About the job',
  ];
  for (const marker of descMarkers) {
    const idx = fullText.indexOf(marker);
    if (idx !== -1) {
      const afterMarker = fullText.slice(idx + marker.length).trim();
      const endMarkers = [
        'Compétences',
        'Niveau d\'ancienneté',
        'Seniority level',
        'Show less',
        'Voir moins',
      ];
      let endIdx = afterMarker.length;
      for (const end of endMarkers) {
        const ei = afterMarker.indexOf(end);
        if (ei !== -1 && ei < endIdx) endIdx = ei;
      }
      description = afterMarker.slice(0, endIdx).trim();
      if (description.length < 20) description = null;
      break;
    }
  }

  let salary: string | null = null;
  const salaryMatch = fullText.match(/(\d{2,}[\d\s,.]*[€$£k]\s*[-–àa]\s*\d{2,}[\d\s,.]*[€$£k])/i)
    || fullText.match(/(\d{2,}[\d\s,.]*\s*(?:€|EUR|USD|£)\s*(?:\/\s*(?:an|mois|year|month))?)/i);
  if (salaryMatch) salary = salaryMatch[1].trim();

  return {
    sourceUrl: getCanonicalUrl(),
    description,
    employmentType,
    seniorityLevel,
    industry: null,
    skills: [],
    salary,
    applicants,
    postedAt,
  };
}

export function scrapeLinkedInJobDetail(): JobDetailData {
  const result = parseBodyText();
  console.log('[PAC Enricher] Scraped result:', result);
  return result;
}
