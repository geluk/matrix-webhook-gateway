import { Headers } from 'node-fetch';
import { UploadedImageRepository } from '../repositories/UploadedImageRepository';
import logger from '../util/logger';
import randomString from '../util/randomString';

// Can't get this to work with an import for whatever reason.
const hasha = require('hasha'); // eslint-disable-line
const mime = require('mime'); // eslint-disable-line

export interface UploadRequest {
  name: string;
  stream: Buffer;
  type: string;
}

export interface DownloadResponse {
  headers: Headers;
  buffer: () => Promise<Buffer>;
}

export interface UploadClient {
  uploadContent: (request: UploadRequest) => Promise<string>;
}

export default class ImageUploader {
  public constructor(
    private client: UploadClient,
    private downloader: (url: string) => Promise<DownloadResponse>,
    private imageRepository: UploadedImageRepository,
  ) { }

  public async uploadImage(userId: string, url: string): Promise<undefined | string> {
    const response = await this.downloader(url);
    const buffer = await response.buffer();

    const hash = hasha(buffer, {
      algorithm: 'sha256',
    });
    const existing = await this.imageRepository.find(hash);
    if (existing) {
      logger.debug(`Found existing image for hash ${hash} (matrix URL: `
      + `${existing.matrix_url}, original URL: ${existing.original_url})`);
      return existing.matrix_url;
    }

    let contentType = response.headers.get('content-type');
    if (!contentType) {
      logger.debug('Could not determine content type from response headers, trying URL');
      contentType = mime.getType(url);
    }
    if (!contentType) {
      logger.warn(`Unable to upload: ${url} to Matrix: could not determine content type.`);
      return undefined;
    }

    const uploadResponse = await this.client.uploadContent({
      name: `webhook-gateway-upload-${randomString(40)}.${mime.getExtension(contentType)}`,
      stream: buffer,
      type: contentType,
    });
    const result: {
      content_uri: string,
    } | undefined = JSON.parse(uploadResponse);
    if (result?.content_uri) {
      await this.imageRepository.add({
        hash,
        original_url: url,
        matrix_url: result.content_uri,
      });
      logger.debug(`Added uploaded image to repository with hash ${hash}`);
    }
    return result?.content_uri;
  }
}
