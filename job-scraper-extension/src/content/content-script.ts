import type { ClientRequest, EnrichResponse, ScanResponse } from '../shared/types';
import { adapters } from './adapters';
import {
  clickLinkedInNextPage,
  getLinkedInListSignature,
  getLinkedInScrollContainerFromCard,
} from './adapters/linkedin';
import { scrapeLinkedInJobDetail } from './adapters/linkedin-detail';

function jitterMs(baseMs: number, pct = 0.2) {
  const clamped = Math.max(0, baseMs);
  const delta = clamped * pct;
  const min = clamped - delta;
  const max = clamped + delta;
  return Math.round(min + Math.random() * (max - min));
}

async function sleepJitter(baseMs: number, pct = 0.2) {
  return new Promise(r => setTimeout(r, jitterMs(baseMs, pct)));
}

function dedupeBySourceUrl<T extends { sourceUrl: string }>(list: T[]): T[] {
  const map = new Map<string, T>();

  for (const x of list) map.set(x.sourceUrl, x);

  return Array.from(map.values());
}

function scanOnce(messageOptions: any) {
  const scrapedAt = new Date().toISOString();
  const ctx = { url: location.href, scrapedAt, options: messageOptions };
  const adapter = adapters.find(a => a.matches(ctx));

  if (!adapter) return [];

  return adapter.scanVisibleCards(ctx);
}

async function waitForListSignatureChange(prevSig: string, timeoutMs: number) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const cur = getLinkedInListSignature();
    if (cur !== prevSig && cur !== 'empty') return true;
    await sleepJitter(200);
  }

  return false;
}

async function scrollDownForCurrentSite() {
  const container = getLinkedInScrollContainerFromCard();

  if (container) {
    const nextTop = Math.min(
      container.scrollTop + Math.floor(container.clientHeight * 0.85),
      container.scrollHeight,
    );

    container.scrollTo({ top: nextTop, behavior: 'smooth' });
    await sleepJitter(300);
    return;
  }

  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  await sleepJitter(300);
}

function countLinkedInCards(): number {
  return document.querySelectorAll('li[data-occludable-job-id]').length;
}

async function waitForMoreCards(prevCount: number, timeoutMs: number) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const cur = countLinkedInCards();
    if (cur > prevCount) return true;
    await sleepJitter(200);
  }
  return false;
}

chrome.runtime.onMessage.addListener(
  (message: ClientRequest, _sender, sendResponse: (res: ScanResponse | EnrichResponse) => void) => {
    if (!message) return;

    (async () => {
      try {
        if (message.type === 'ENRICH_JOB') {
          const isJobDetailPage = /linkedin\.com\/jobs\/view\/\d+/.test(location.href);
          if (!isJobDetailPage) {
            sendResponse({ ok: false, error: 'Not on a LinkedIn job detail page' });
            return;
          }
          const details = scrapeLinkedInJobDetail();
          sendResponse({ ok: true, details });
          return;
        }

        if (message.type === 'SCAN_PAGE') {
          const offers = scanOnce(message.options);
          sendResponse({ ok: true, offers });
          return;
        }

        if (message.type === 'AUTO_SCROLL_SCAN') {
          const iterations = Math.max(1, Math.min(message.iterations, 30));
          const delayMs = jitterMs(Math.max(200, Math.min(message.delayMs, 5000)));

          const pages = Math.max(1, Math.min(message.pages ?? 1, 15)); // 5–10 recommandé
          const pageDelayMs = Math.max(200, Math.min(message.pageDelayMs ?? delayMs, 8000));

          let acc: ReturnType<typeof scanOnce> = [];

          for (let page = 0; page < pages; page++) {
            // 1) loop scroll+scan sur la page courante
            for (let i = 0; i < iterations; i++) {
              acc = dedupeBySourceUrl([...acc, ...scanOnce(message.options)]);

              const prevCount = countLinkedInCards();
              await scrollDownForCurrentSite();
              await waitForMoreCards(prevCount, delayMs);
            }

            acc = dedupeBySourceUrl([...acc, ...scanOnce(message.options)]);

            if (page === pages - 1) break;

            const prevSig = getLinkedInListSignature();
            const clicked = clickLinkedInNextPage();
            if (!clicked) break;

            await waitForListSignatureChange(prevSig, pageDelayMs);
            await sleepJitter(250);
          }

          sendResponse({ ok: true, offers: acc });
          return;
        }
      } catch (e) {
        const error = e instanceof Error ? e.message : 'Unknown error';
        sendResponse({ ok: false, error });
      }
    })();

    return true;
  },
);
