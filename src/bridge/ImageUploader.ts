import * as hasha from 'hasha';
import * as mime from 'mime';

import logger from '../util/logger';
import randomString from '../util/randomString';
import { CacheDetails } from '../downloads/caching';
import { DownloadResponse } from '../downloads/downloader';
import { CachedImageRepository } from '../repositories/CachedImageRepository';

export interface UploadRequest {
  name: string;
  stream: Buffer;
  type: string;
}

export interface UploadClient {
  uploadContent: (
    data: Buffer,
    contentType?: string,
    filename?: string,
  ) => Promise<string>;
}

function hash(input: hasha.HashaInput): string {
  return hasha.default(input, {
    algorithm: 'sha256',
    encoding: 'base64',
  });
}

export default class ImageUploader {
  public constructor(
    private client: UploadClient,
    private downloader: (
      url: string,
      cacheDetails?: CacheDetails,
    ) => Promise<DownloadResponse>,
    private imageRepository: CachedImageRepository,
  ) {}

  public async uploadImage(url: string): Promise<undefined | string> {
    const existingImage = await this.imageRepository.findByUrl(url);

    const download = await this.downloader(url, existingImage?.cache_details);

    // We already downloaded this image earlier, and it's still fresh (i.e.
    // we're allowed to cache it, and the cache duration has not expired yet).
    if (download.status === 'fresh') {
      logger.debug(`Found fresh image in cache for URL '${url}'`);
      // existingImage can never be undefined in this situation.
      return existingImage?.matrix_url;
    }

    // The image was stale. We checked with the server whether we could still
    // use it.
    logger.debug(`Found stale image in cache for URL '${url}'`);

    if (download.status === 'error') {
      logger.info(
        `Error ${download.statusCode} while trying to download '${url}'`,
      );
      return undefined;
    }

    // We had an ETag available, and made a conditional request, which allowed
    // the server to indicate with an 304 status that our cached copy is still
    // up to date.
    if (download.status === 'not-modified') {
      if (!existingImage) {
        // We didn't supply an ETag in the If-None-Match header, but we still
        // got a 304. Weird.
        logger.info(
          `Received an unexpected 304 while trying to download '${url}'`,
        );
        return undefined;
      }
      // The existing image was successfully revalidated, and the downloader
      // has provided us with the next revalidation timestamp, so we should
      // write it back to the database.
      const details = {
        revalidateAfter: download.revalidateAfter,
        etag: download.etag ?? undefined,
      };
      await this.imageRepository.updateCacheDetails(
        existingImage.url_hash,
        details,
      );
      return existingImage.matrix_url;
    }

    // We downloaded an image from the server. This could either be a completely
    // new image, or an updated version of a cached image.

    if (!download.contentType) {
      logger.warn(
        `Unable to upload '${url}' to Matrix: could not determine content type.`,
      );
      return undefined;
    }

    const contentHash = hash(download.buffer);
    if (existingImage?.content_hash === contentHash) {
      // Even though the server wanted us to re-download the image, we still
      // received the same content. This may happen if the server does not
      // support caching, and the default cache duration has expired, or if the
      // server sends a Cache-Control header, but doesn't support If-None-Match,
      // for example. The way to deal with this is quite simple, just update the
      // cache entry.
      const details = {
        revalidateAfter: download.revalidateAfter,
        etag: download.etag ?? undefined,
      };
      logger.debug(`Image re-downloaded with unchanged content from '${url}'`);
      await this.imageRepository.updateCacheDetails(
        existingImage.url_hash,
        details,
      );
      return existingImage.matrix_url;
    }

    // At this point, we know that we received a new image. However, it is
    // still possible that we've uploaded the same content to Matrix before.
    // In the future, we may also want to reuse the old uploaded_image table
    // so we can be a bit more smart about this.
    // For now, we'll just upload the image.
    const filename = `webhook-gateway-upload-${randomString(
      40,
    )}.${mime.getExtension(download.contentType)}`;
    const contentUri = await this.client.uploadContent(
      download.buffer,
      download.contentType,
      filename,
    );

    // We already had an image cached for this URL, but we need to update it.
    if (existingImage) {
      logger.debug(`Updated existing image for URL '${url}'`);
    } else {
      logger.debug(`Downloaded new image from '${url}'`);
    }

    await this.imageRepository.addOrUpdate({
      url_hash: existingImage?.url_hash || hash(url),
      original_url: url,
      matrix_url: contentUri,
      last_retrieved: new Date(),
      content_hash: contentHash,
      cache_details: {
        revalidateAfter: download.revalidateAfter,
        etag: download.etag ?? undefined,
      },
    });

    return contentUri;
  }
}
