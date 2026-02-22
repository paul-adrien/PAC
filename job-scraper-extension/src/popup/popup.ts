import './popup.css';
import type { ScanRequest, ScanResponse } from '../shared/types';
import { sendScanToTab } from '../shared/messaging';
import type { JobOffer } from '../shared/types';

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
  document.getElementById('clearBtn')?.addEventListener('click', onClearClick);

  render();
}

main();
