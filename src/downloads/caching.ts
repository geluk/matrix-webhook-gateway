import { assert } from 'typia';

export interface CacheDetails {
  etag: string | undefined;
  revalidateAfter: Date;
}

// This doesn't quite work like a browser does, because unlike a browser,
// we save an image, and only use the cache-control header to determine for
// how long we may reuse it without revalidating.
export function parseCacheControl(cacheControl: string | null): Date {
  let revalidateAfter = secondsFromNow(1800);
  if (!cacheControl) {
    return revalidateAfter;
  }

  const directives = cacheControl
    .toLowerCase()
    .split(',')
    .map((d) => d.trim().split('='));

  for (const [key, value] of directives) {
    if (key === 'no-cache') {
      revalidateAfter = secondsFromNow(0);
    } else if (key === 'no-store') {
      revalidateAfter = secondsFromNow(0);
    }
    const seconds = parseInt(value, 10);
    if (!Number.isNaN(seconds) && key === 'max-age') {
      revalidateAfter = secondsFromNow(seconds);
    }
  }
  return revalidateAfter;
}

export function isCacheFresh(cacheDetails: CacheDetails): boolean {
  const now = new Date();
  return now < cacheDetails.revalidateAfter;
}

export function parseCacheDetails(s: string): CacheDetails {
  const details = JSON.parse(s);
  assert<{ revalidateAfter: string }>(details);
  details.revalidateAfter = new Date(details.revalidateAfter);
  assert<CacheDetails>(details);
  return details;
}

export function stringifyCacheDetails(cacheDetails?: CacheDetails): string {
  return JSON.stringify(cacheDetails ?? null);
}

function secondsFromNow(seconds: number) {
  return new Date(Date.now() + seconds * 1000);
}
