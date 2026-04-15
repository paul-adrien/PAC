const HEADER_RE = /^(RÉSUMÉ[_ ]?PROFIL|RESUME[_ ]?PROFIL|Résumé\s+(?:du\s+)?profil)\b[:]?\s*$/i;
const SECTION_RE = /^[A-ZÉÈÀÇÂÊÎÔÛ][A-ZÉÈÀÇÂÊÎÔÛ0-9_ /-]{2,}\s*:?\s*$/;

export function extractProfileSummary(profile: string): string {
  if (!profile) return '';
  const lines = profile.split('\n');
  const headerIdx = lines.findIndex(l => HEADER_RE.test(l.trim()));
  if (headerIdx === -1) return '';
  const start = headerIdx + 1;
  let end = lines.length;
  for (let i = start; i < lines.length; i++) {
    if (SECTION_RE.test(lines[i].trim()) && !HEADER_RE.test(lines[i].trim())) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join('\n').trim();
}
