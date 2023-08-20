import mime from 'mime';
import logger from '../util/logger';
import parseCacheControl from './cacheControl';

// eslint-disable-next-line
const fetch = require('node-fetch');

export type DownloadResponse =
  | ContentResponse
  | NotModifiedResponse
  | ErrorResponse;

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

export default async function downloader(
  url: string,
  etag?: string,
): Promise<DownloadResponse> {
  const headers = {
    'User-Agent': 'matrix-webhook-gateway/0',
  } as Record<string, string>;
  if (etag) {
    headers['If-None-Match'] = etag;
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
