import fetch from 'node-fetch';
import mime from 'mime';
import logger from '../util/logger';
import { CacheDetails, isCacheFresh, parseCacheControl } from './caching';
import VERSION from '../util/version';

const USER_AGENT = `matrix-webhook-gateway/${VERSION}`;

export type DownloadResponse =
  | Fresh
  | ContentResponse
  | NotModifiedResponse
  | ErrorResponse;

export interface Fresh {
  status: 'fresh';
}

export interface ContentResponse {
  status: 'ok';
  contentType: string | null;
  revalidateAfter: Date;
  etag: string | null;
  buffer: Buffer;
}

export interface NotModifiedResponse {
  status: 'not-modified';
  revalidateAfter: Date;
  etag: string | null;
}

export interface ErrorResponse {
  status: 'error';
  statusCode: number;
}

export default async function downloader(
  url: string,
  cacheDetails?: CacheDetails,
): Promise<DownloadResponse> {
  if (cacheDetails && isCacheFresh(cacheDetails)) {
    return { status: 'fresh' };
  }

  const headers = {
    'User-Agent': USER_AGENT,
  } as Record<string, string>;
  if (cacheDetails?.etag) {
    headers['If-None-Match'] = cacheDetails.etag;
  }

  const response = await fetch(url, {
    redirect: 'follow',
    headers,
  });

  const revalidateAfter = parseCacheControl(
    response.headers.get('Cache-Control'),
  );
  if (response.status === 304) {
    return {
      status: 'not-modified',
      revalidateAfter,
      etag: response.headers.get('ETag'),
    };
  }
  if (!response.ok) {
    return {
      status: 'error',
      statusCode: response.status,
    };
  }
  return {
    status: 'ok',
    buffer: await response.buffer(),
    contentType: determineContentType(
      response.headers.get('Content-Type'),
      url,
    ),
    revalidateAfter,
    etag: response.headers.get('ETag'),
  };
}

function determineContentType(
  contentType: string | null,
  url: string,
): string | null {
  if (!contentType) {
    logger.debug(
      'Could not determine content type from response headers, trying URL',
    );
    return mime.getType(url);
  }
  return contentType;
}
