import type {
  AutoScrollScanRequest,
  ClientRequest,
  EnrichResponse,
  ScanOptions,
  ScanResponse,
} from '../shared/types';
import { adapters } from './adapters';
import type { ScanContext, SiteAdapter } from './adapters/types';

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

function findListingAdapter(): { adapter: SiteAdapter; ctx: ScanContext } | null {
  const scrapedAt = new Date().toISOString();
  const ctx: ScanContext = { url: location.href, scrapedAt };
  const adapter = adapters.find(a => a.matches(ctx));
  return adapter ? { adapter, ctx } : null;
}

function findDetailAdapter(): SiteAdapter | null {
  return adapters.find(a => a.matchesDetailUrl(location.href)) ?? null;
}

function scanOnce(adapter: SiteAdapter, options: ScanOptions | undefined) {
  const scrapedAt = new Date().toISOString();
  const ctx: ScanContext = { url: location.href, scrapedAt, options };
  return adapter.scanVisibleCards(ctx);
}

async function waitForListSignatureChange(
  adapter: SiteAdapter,
  prevSig: string,
  timeoutMs: number,
) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const cur = adapter.getListSignature();
    if (cur !== prevSig && cur !== 'empty') return true;
    await sleepJitter(200);
  }
  return false;
}

async function scrollDown(adapter: SiteAdapter) {
  const container = adapter.getScrollContainer();
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

async function waitForMoreCards(adapter: SiteAdapter, prevCount: number, timeoutMs: number) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (adapter.countCards() > prevCount) return true;
    await sleepJitter(200);
  }
  return false;
}

function handleEnrich(): EnrichResponse {
  const adapter = findDetailAdapter();
  if (!adapter) return { ok: false, error: "Pas sur une page d'offre supportée" };
  return { ok: true, details: adapter.scrapeDetail() };
}

function handleScan(options: ScanOptions | undefined): ScanResponse {
  const found = findListingAdapter();
  if (!found) return { ok: true, offers: [] };
  return { ok: true, offers: scanOnce(found.adapter, options) };
}

async function handleAutoScroll(message: AutoScrollScanRequest): Promise<ScanResponse> {
  const found = findListingAdapter();
  if (!found) return { ok: true, offers: [] };
  const { adapter } = found;

  const iterations = Math.max(1, Math.min(message.iterations, 30));
  const delayMs = jitterMs(Math.max(200, Math.min(message.delayMs, 5000)));
  const pages = Math.max(1, Math.min(message.pages ?? 1, 15));
  const pageDelayMs = Math.max(200, Math.min(message.pageDelayMs ?? delayMs, 8000));

  let acc: ReturnType<typeof scanOnce> = [];
  const isInfiniteScroll = adapter.paginationMode === 'infinite-scroll';

  for (let page = 0; page < pages; page++) {
    if (isInfiniteScroll) {
      for (let i = 0; i < iterations; i++) {
        acc = dedupeBySourceUrl([...acc, ...scanOnce(adapter, message.options)]);
        const prevCount = adapter.countCards();
        await scrollDown(adapter);
        await waitForMoreCards(adapter, prevCount, delayMs);
      }
    }
    acc = dedupeBySourceUrl([...acc, ...scanOnce(adapter, message.options)]);

    if (page === pages - 1) break;

    const prevSig = adapter.getListSignature();
    if (!adapter.clickNextPage()) break;

    await waitForListSignatureChange(adapter, prevSig, pageDelayMs);
    await sleepJitter(250);
  }

  return { ok: true, offers: acc };
}

async function handleMessage(message: ClientRequest): Promise<ScanResponse | EnrichResponse> {
  try {
    if (message.type === 'ENRICH_JOB') return handleEnrich();
    if (message.type === 'SCAN_PAGE') return handleScan(message.options);
    if (message.type === 'AUTO_SCROLL_SCAN') return handleAutoScroll(message);
    return { ok: false, error: 'Unknown message type' };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

chrome.runtime.onMessage.addListener(
  (message: ClientRequest, _sender, sendResponse: (res: ScanResponse | EnrichResponse) => void) => {
    if (!message) return;
    handleMessage(message).then(sendResponse);
    return true;
  },
);
