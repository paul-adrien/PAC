export const DAILY_GENERATION_LIMIT = 50;

export const GENERATION_TYPES = ['cv_header', 'cover_letter', 'interview_prep'] as const;
export type GenerationType = (typeof GENERATION_TYPES)[number];

export const PROVIDERS = ['ollama', 'claude'] as const;
export type Provider = (typeof PROVIDERS)[number];

export const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral-nemo';

export const OFFER_EXTRACTION_PROMPT = `Tu analyses une offre d'emploi et extrais ses points clés sous forme JSON.

OFFRE :
Titre : {{jobTitle}}
Entreprise : {{jobCompany}}
Lieu : {{jobLocation}}
Description : {{jobDescription}}
Compétences demandées : {{jobSkills}}

Renvoie UNIQUEMENT un objet JSON valide, sans texte avant ni après, sans markdown, sans triple backticks.

Format attendu (tous les champs sont obligatoires) :
{
  "role": "intitulé du poste, 5 à 8 mots",
  "seniority": "niveau demandé : junior, confirmé, senior ou lead",
  "topSkills": ["compétence 1", "compétence 2", "compétence 3", "compétence 4", "compétence 5"],
  "fullStack": ["toutes les technos mentionnées dans l'offre (langages, frameworks, outils, infra, tests, etc.), jusqu'à 10 éléments"],
  "mainMission": "mission principale du poste en une phrase de 15 mots maximum",
  "productContext": "quel produit ou service le candidat va construire concrètement, et pour qui, en 15 mots maximum",
  "companyFocus": "ce que fait l'entreprise en une phrase de 12 mots maximum",
  "teamCulture": "comment l'équipe travaille (méthodes, rituels, organisation), en 20 mots maximum",
  "candidateQualities": ["3 à 5 qualités personnelles recherchées chez le candidat, en un mot ou deux chacune"]
}

Règles :
- Base-toi uniquement sur le texte de l'offre. N'invente rien.
- Si une info n'est pas dans l'offre, mets une chaîne vide "" ou un tableau vide [].
- Écris en français.
- topSkills : exactement 5 éléments, en ordre de priorité (les technos cœur).
- fullStack : inclut topSkills + toutes les autres technos mentionnées (infra, tests, outils).
- candidateQualities : qualités personnelles (autonomie, curiosité, rigueur...), pas des compétences techniques.
- Pas de phrase d'introduction, pas de commentaire. Uniquement le JSON.`;

export const DEFAULT_PROMPTS: Record<GenerationType, string> = {
  cv_header: `TA TÂCHE : produire une version personnalisée du résumé de profil d'un candidat, adaptée à une offre.

RÉSUMÉ DE PROFIL À ADAPTER (texte de référence — c'est ta base) :
"""
{{profileSummary}}
"""

POINTS CLÉS DE L'OFFRE VISÉE (pré-analysés, utilise-les pour orienter le contenu) :
- Rôle : {{offerRole}}
- Niveau : {{offerSeniority}}
- Mission principale : {{offerMission}}
- Produit / contexte : {{offerProductContext}}
- Entreprise : {{offerCompanyFocus}}
- Culture d'équipe : {{offerTeamCulture}}
- Compétences clés recherchées : {{offerTopSkills}}
- Stack technique complète mentionnée : {{offerFullStack}}
- Qualités recherchées chez le candidat : {{offerCandidateQualities}}

Tous ces points ne doivent PAS forcément apparaître dans le résumé final. Sélectionne seulement ceux qui s'alignent avec le profil existant et qui renforcent sa pertinence pour l'offre.

COMMENT FAIRE :
1. Reproduis fidèlement la VOIX du résumé de référence :
   - Même personne grammaticale : si le résumé utilise des verbes sans sujet explicite (« Intervient », « Habitué à », « Maîtrise », « Apprécie »), reste dans cette forme. Si le résumé utilise « je », utilise « je ». N'introduis jamais une personne différente.
   - Même longueur (±15 %).
   - Mêmes formulations, même vocabulaire, même rythme de phrases.
2. Ajuste uniquement le contenu :
   - Mets en avant les éléments du résumé qui correspondent aux points clés de l'offre.
   - Tu peux réordonner les phrases et ajouter 1 à 2 touches ciblées (techno, domaine, nom de l'entreprise).
   - Retire ou atténue les éléments non pertinents pour cette offre.
3. Ne réécris pas de zéro : pars du texte de référence et ajuste-le.

INTERDICTIONS ABSOLUES :
- N'écris PAS une offre d'emploi. Interdit : « Vous serez responsable », « Nous offrons », « En tant que [rôle] chez nous », « Je rédige une offre ».
- N'écris PAS une lettre de motivation. Interdit : « Madame, Monsieur », « Cordialement », « Je me permets ».
- Pas de puces, pas d'astérisque, pas de sections (« Formation : », « Compétences : »), pas de markdown, pas de gras.
- Pas de nom, prénom, email, téléphone, adresse, école, lien.
- Pas de placeholder entre crochets ([Nom], [XYZ]).
- Pas d'écriture inclusive parenthésée (« motivé(e) », « développeur/se »).
- Pas de préambule (« Voici... », « Je serais ravi... »). Commence directement.
- Pas de conclusion méta (« J'espère... », « N'hésitez pas... »).
- Un seul paragraphe de prose continue, sans saut de ligne.
- Français uniquement.

Réponds UNIQUEMENT avec le nouveau résumé personnalisé, rien d'autre.`,

  cover_letter: `Tu rédiges une lettre de motivation personnalisée, à partir du profil du candidat et de l'offre ci-dessous.

CE QUE TU DOIS PRODUIRE :
Exactement 3 à 4 paragraphes en prose continue, écrits à la première personne, en français, qui constituent le corps d'une lettre de motivation.

STRUCTURE :
- Paragraphe 1 : accroche courte, pourquoi cette offre / cette entreprise en particulier.
- Paragraphe 2 : parcours — 1 à 2 expériences concrètes du profil qui répondent aux besoins de l'offre.
- Paragraphe 3 : motivation — ce que tu apportes + ce que tu cherches.
- Paragraphe 4 (optionnel) : conclusion courte avec invitation à un échange.

RÈGLES STRICTES — toute violation invalide ta réponse :
1. 3 à 4 paragraphes, pas plus. Séparés par une ligne vide.
2. Uniquement le CORPS de la lettre. Pas de formule d'appel (« Madame, Monsieur, »), pas d'en-tête avec adresse/date, pas de signature, pas de « Cordialement ».
3. Aucune puce, aucun astérisque, aucun titre de section, aucun markdown.
4. N'INVENTE RIEN. Utilise uniquement les infos du PROFIL. Si une info manque, ne la mentionne pas.
5. Pas de préambule (« Voici la lettre... », « Je serais ravi... »). Commence directement par la première phrase.
6. Pas de conclusion méta (« J'espère... », « N'hésitez pas à me contacter... » est accepté, mais pas « Voici ma lettre », « En résumé »).
7. Pas de reformulation brute de l'offre ni de phrases génériques (« votre entreprise leader sur son marché »).
8. Longueur totale : 250 à 400 mots maximum.
9. Langue : français uniquement.

PROFIL DU CANDIDAT :
{{profile}}

OFFRE :
Titre : {{jobTitle}}
Entreprise : {{jobCompany}}
Lieu : {{jobLocation}}
Description : {{jobDescription}}
Compétences demandées : {{jobSkills}}

Réponds UNIQUEMENT avec les paragraphes de la lettre, rien d'autre.`,
  interview_prep: '',
};
