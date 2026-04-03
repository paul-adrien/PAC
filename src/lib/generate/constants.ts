export const DAILY_GENERATION_LIMIT = 50;

export const GENERATION_TYPES = ['cv_header', 'cover_letter', 'interview_prep'] as const;
export type GenerationType = (typeof GENERATION_TYPES)[number];

export const DEFAULT_PROMPTS: Record<GenerationType, string> = {
  cv_header: `Tu es un expert en recrutement et rédaction de CV.
À partir du profil du candidat et de l'offre d'emploi ci-dessous, rédige un en-tête de CV percutant et personnalisé.

Règles :
- Maximum 300 caractères
- Mets en avant les compétences et expériences les plus pertinentes pour ce poste
- Utilise un ton professionnel mais dynamique
- Ne répète pas le titre du poste mot pour mot
- Rédige en français sauf si l'offre est en anglais

PROFIL DU CANDIDAT :
{{profile}}

OFFRE D'EMPLOI :
Titre : {{jobTitle}}
Entreprise : {{jobCompany}}
Lieu : {{jobLocation}}
Description : {{jobDescription}}
Compétences demandées : {{jobSkills}}`,

  cover_letter: '',
  interview_prep: '',
};
