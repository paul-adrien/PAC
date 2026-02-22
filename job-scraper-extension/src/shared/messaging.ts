import type { ScanRequest, ScanResponse } from './types';

export async function sendScanToTab(tabId: number, req: ScanRequest): Promise<ScanResponse> {
  return await chrome.tabs.sendMessage(tabId, req);
}
