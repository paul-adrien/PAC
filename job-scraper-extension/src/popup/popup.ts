import './popup.css';
import type { ScanRequest, ScanResponse, EnrichResponse, JobOffer } from '../shared/types';
import { sendScanToTab } from '../shared/messaging';

let offersState: JobOffer[] = [];

function dedupeBySourceUrl(list: JobOffer[]): JobOffer[] {
  const map = new Map<string, JobOffer>();
  for (const o of list) {
    map.set(o.sourceUrl, o);
  }
  return Array.from(map.values());
}

function render() {
  setText('count', String(offersState.length));
  setPreview(offersState.slice(0, 5));
}

function getPagesValue(): number {
  const el = document.getElementById('pagesInput') as HTMLInputElement | null;
  const n = Number(el?.value ?? 1);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(15, Math.floor(n)));
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ?? null;
}

function extractDomain(urlStr: string): string {
  return new URL(urlStr).hostname;
}

function setText(id: string, value: string) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setPreview(obj: unknown) {
  const el = document.getElementById('preview');
  if (!el) return;
  el.textContent = JSON.stringify(obj, null, 2);
}

async function onScanClick() {
  const btn = document.getElementById('scanBtn') as HTMLButtonElement | null;
  btn?.setAttribute('disabled', 'true');

  try {
    const tab = await getActiveTab();
    if (!tab?.id) {
      setPreview({ error: 'No active tab' });
      return;
    }

    const req: ScanRequest = { type: 'SCAN_PAGE', options: { maxCards: 50 } };
    const res: ScanResponse = await sendScanToTab(tab.id, req);

    if (!res.ok) {
      setPreview(res);
      setText('count', '0');
      return;
    }

    offersState = dedupeBySourceUrl([...offersState, ...res.offers]);
    render();
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Unknown error';
    setPreview({ ok: false, error });
  } finally {
    btn?.removeAttribute('disabled');
  }
}

function onExportClick() {
  const ts = new Date().toISOString().replaceAll(':', '-');
  downloadJson(`job-scrape-${ts}.json`, {
    exportedAt: new Date().toISOString(),
    count: offersState.length,
    offers: offersState,
  });
}

function onClearClick() {
  offersState = [];
  render();
}

function setStatus(text: string) {
  const el = document.getElementById('enrichStatus');
  if (el) el.textContent = text;
}

async function postImport(): Promise<{ ok: boolean; result?: { inserted: number; updated_last_seen: number }; error?: string }> {
  await saveSettings();
  const apiUrl = getApiUrl();
  const token = getApiToken();

  const res = await fetch(`${apiUrl}/api/jobs/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      exportedAt: new Date().toISOString(),
      count: offersState.length,
      offers: offersState,
    }),
  });

  return res.json();
}

async function onSendClick() {
  const btn = document.getElementById('sendBtn') as HTMLButtonElement | null;
  btn?.setAttribute('disabled', 'true');

  if (offersState.length === 0) {
    setStatus('Aucune offre à envoyer');
    btn?.removeAttribute('disabled');
    return;
  }

  setStatus(`Envoi de ${offersState.length} offres...`);

  try {
    const json = await postImport();
    if (json.ok && json.result) {
      setStatus(`Importé : ${json.result.inserted} nouvelles, ${json.result.updated_last_seen} maj`);
    } else {
      setStatus(json.error ?? 'Erreur API');
    }
  } catch (e) {
    setStatus(e instanceof Error ? e.message : 'Erreur inconnue');
  } finally {
    btn?.removeAttribute('disabled');
  }
}

async function onAutoClick() {
  const btn = document.getElementById('autoBtn') as HTMLButtonElement | null;
  btn?.setAttribute('disabled', 'true');

  try {
    const tab = await getActiveTab();
    if (!tab?.id) {
      setPreview({ error: 'No active tab' });
      return;
    }

    const res = await chrome.tabs.sendMessage(tab.id, {
      type: 'AUTO_SCROLL_SCAN',
      iterations: 6,
      delayMs: 1200,
      pages: getPagesValue(),
      pageDelayMs: 1500,
      options: { maxCards: 50 },
    });

    if (!res.ok) {
      setPreview(res);
      return;
    }

    offersState = dedupeBySourceUrl([...offersState, ...res.offers]);
    render();
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Unknown error';
    setPreview({ ok: false, error });
  } finally {
    btn?.removeAttribute('disabled');
  }
}

function getApiUrl(): string {
  const el = document.getElementById('apiUrl') as HTMLInputElement | null;
  return (el?.value ?? 'http://localhost:3000').replace(/\/+$/, '');
}

function getApiToken(): string {
  const el = document.getElementById('apiToken') as HTMLInputElement | null;
  return el?.value ?? '';
}

async function saveSettings() {
  await chrome.storage.local.set({
    apiUrl: getApiUrl(),
    apiToken: getApiToken(),
  });
}

async function loadSettings() {
  const { apiUrl, apiToken } = await chrome.storage.local.get(['apiUrl', 'apiToken']);
  const urlEl = document.getElementById('apiUrl') as HTMLInputElement | null;
  const tokenEl = document.getElementById('apiToken') as HTMLInputElement | null;
  if (urlEl && typeof apiUrl === 'string') urlEl.value = apiUrl;
  if (tokenEl && typeof apiToken === 'string') tokenEl.value = apiToken;
}

async function onEnrichClick() {
  const btn = document.getElementById('enrichBtn') as HTMLButtonElement | null;
  const statusEl = document.getElementById('enrichStatus');
  btn?.setAttribute('disabled', 'true');
  if (statusEl) statusEl.textContent = 'Scraping...';

  try {
    const tab = await getActiveTab();
    if (!tab?.id) {
      if (statusEl) statusEl.textContent = "Pas d'onglet actif";
      return;
    }

    const res: EnrichResponse = await chrome.tabs.sendMessage(tab.id, { type: 'ENRICH_JOB' });

    if (!res.ok) {
      if (statusEl) statusEl.textContent = res.error;
      return;
    }

    if (statusEl) statusEl.textContent = 'Envoi vers PAC...';

    await saveSettings();
    const apiUrl = getApiUrl();
    const token = getApiToken();

    const apiRes = await fetch(`${apiUrl}/api/jobs/enrich`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        sourceUrl: res.details.sourceUrl,
        details: {
          description: res.details.description,
          employmentType: res.details.employmentType,
          seniorityLevel: res.details.seniorityLevel,
          industry: res.details.industry,
          skills: res.details.skills,
          salary: res.details.salary,
          applicants: res.details.applicants,
          postedAt: res.details.postedAt,
        },
      }),
    });

    const json = await apiRes.json();

    if (apiRes.ok && json.ok) {
      if (statusEl) statusEl.textContent = 'Offre enrichie !';
    } else {
      if (statusEl) statusEl.textContent = json.error ?? 'Erreur API';
    }
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Erreur inconnue';
    if (statusEl) statusEl.textContent = error;
  } finally {
    btn?.removeAttribute('disabled');
  }
}

function getCanonicalJobUrl(tabUrl: string): string | null {
  try {
    const u = new URL(tabUrl);
    const m = u.pathname.match(/\/jobs\/view\/(\d+)/);
    if (m?.[1]) return `https://www.linkedin.com/jobs/view/${m[1]}/`;
  } catch {}
  return null;
}

async function onApplyClick() {
  const btn = document.getElementById('applyBtn') as HTMLButtonElement | null;
  const statusEl = document.getElementById('enrichStatus');
  btn?.setAttribute('disabled', 'true');

  try {
    const tab = await getActiveTab();
    const jobUrl = tab?.url ? getCanonicalJobUrl(tab.url) : null;

    if (!jobUrl) {
      if (statusEl) statusEl.textContent = "Pas sur une page d'offre LinkedIn";
      return;
    }

    await saveSettings();
    const apiUrl = getApiUrl();
    const token = getApiToken();

    const res = await fetch(`${apiUrl}/api/jobs/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ sourceUrl: jobUrl }),
    });

    const json = await res.json();

    if (res.ok && json.ok) {
      if (statusEl) statusEl.textContent = json.applied ? 'Candidature enregistrée !' : 'Candidature retirée';
    } else {
      if (statusEl) statusEl.textContent = json.error ?? 'Erreur API';
    }
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Erreur inconnue';
    if (statusEl) statusEl.textContent = error;
  } finally {
    btn?.removeAttribute('disabled');
  }
}

async function onDismissClick() {
  const btn = document.getElementById('dismissBtn') as HTMLButtonElement | null;
  const statusEl = document.getElementById('enrichStatus');
  btn?.setAttribute('disabled', 'true');

  try {
    const tab = await getActiveTab();
    const jobUrl = tab?.url ? getCanonicalJobUrl(tab.url) : null;

    if (!jobUrl) {
      if (statusEl) statusEl.textContent = "Pas sur une page d'offre LinkedIn";
      return;
    }

    await saveSettings();
    const apiUrl = getApiUrl();
    const token = getApiToken();

    const res = await fetch(`${apiUrl}/api/jobs/dismiss`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ sourceUrl: jobUrl }),
    });

    const json = await res.json();

    if (res.ok && json.ok) {
      if (statusEl) statusEl.textContent = json.dismissed ? 'Offre masquée' : 'Offre restaurée';
    } else {
      if (statusEl) statusEl.textContent = json.error ?? 'Erreur API';
    }
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Erreur inconnue';
    if (statusEl) statusEl.textContent = error;
  } finally {
    btn?.removeAttribute('disabled');
  }
}

async function main() {
  const tab = await getActiveTab();
  const url = tab?.url ?? null;

  if (!url) setText('domain', 'Aucun onglet');
  else {
    try {
      setText('domain', extractDomain(url));
    } catch {
      setText('domain', 'URL invalide');
    }
  }

  document.getElementById('autoBtn')?.addEventListener('click', onAutoClick);
  document.getElementById('scanBtn')?.addEventListener('click', onScanClick);
  document.getElementById('exportBtn')?.addEventListener('click', onExportClick);
  document.getElementById('sendBtn')?.addEventListener('click', onSendClick);
  document.getElementById('clearBtn')?.addEventListener('click', onClearClick);
  document.getElementById('enrichBtn')?.addEventListener('click', onEnrichClick);
  document.getElementById('applyBtn')?.addEventListener('click', onApplyClick);
  document.getElementById('dismissBtn')?.addEventListener('click', onDismissClick);

  await loadSettings();
  document.getElementById('apiUrl')?.addEventListener('change', saveSettings);
  document.getElementById('apiToken')?.addEventListener('change', saveSettings);

  render();
}

main();
