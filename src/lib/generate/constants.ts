export const DAILY_GENERATION_LIMIT = 50;

export const GENERATION_TYPES = ['cv_header', 'cover_letter', 'interview_prep'] as const;
export type GenerationType = (typeof GENERATION_TYPES)[number];

export const PROVIDERS = ['ollama', 'claude'] as const;
export type Provider = (typeof PROVIDERS)[number];

export const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';

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

  cover_letter: `Tu es un expert en rédaction de lettres de motivation professionnelles.
À partir du profil du candidat et de l'offre d'emploi ci-dessous, rédige une lettre de motivation percutante et personnalisée.

Règles :
- Structure classique : accroche, parcours pertinent, motivation pour le poste/entreprise, conclusion avec appel à l'action
- Mets en avant les expériences et compétences les plus pertinentes pour ce poste
- Montre une compréhension de l'entreprise et du rôle
- Ton professionnel mais authentique, pas de phrases génériques
- Rédige en français sauf si l'offre est en anglais
- Maximum 350 mots

PROFIL DU CANDIDAT :
{{profile}}

OFFRE D'EMPLOI :
Titre : {{jobTitle}}
Entreprise : {{jobCompany}}
Lieu : {{jobLocation}}
Description : {{jobDescription}}
Compétences demandées : {{jobSkills}}`,
  interview_prep: '',
};
