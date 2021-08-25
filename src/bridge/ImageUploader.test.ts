import hasha from 'hasha';
import { DownloadResponse } from '../downloads/downloader';
import CachedImage from '../models/CachedImage';
import { CachedImageRepository } from '../repositories/CachedImageRepository';
import ImageUploader, { UploadClient } from './ImageUploader';

type UploadResponse =
  | { content_uri: string }
  | undefined;

function getClient(response?: UploadResponse): UploadClient {
  return {
    uploadContent: async (_rq) => JSON.stringify(response),
  };
}

function getOkDownloader(content?: string):
(url: string) => Promise<DownloadResponse> {
  return async (_url: string) => ({
    contentType: 'image/png',
    status: 'ok',
    buffer: Buffer.from(content || 'new'),
    revalidateAfter: new Date(),
    etag: null,
  });
}

function getNotModifiedDownloader():
(url: string) => Promise<DownloadResponse> {
  return async (_url: string) => ({
    status: 'not-modified',
    revalidateAfter: new Date(),
    etag: null,
  });
}

function getErrorDownloader():
(url: string) => Promise<DownloadResponse> {
  return async (_url: string) => ({
    status: 'error',
    statusCode: 404,
  });
}

function getImage(revalidateAfter?: Date, content?: string): CachedImage {
  return {
    original_url: 'https://example.com/image.png',
    url_hash: 'asdf',
    content_hash: hasha(content || 'existing', {
      algorithm: 'sha256',
      encoding: 'base64',
    }),
    last_retrieved: new Date(),
    matrix_url: 'mxc://existing',
    cache_details: {
      etag: null,
      revalidateAfter: revalidateAfter ?? new Date(),
    },
  };
}

function getRepository(): CachedImageRepository {
  return {
    addOrUpdate: async (_image) => undefined,
    findByUrl: async (_url) => undefined,
    updateCacheDetails: async (_details) => undefined,
  };
}

test('Returns correct content URL', async () => {
  const repository = getRepository();

  const uploader = new ImageUploader(getClient({
    content_uri: 'mxc://example',
  }), getOkDownloader(), repository);

  const result = await uploader.uploadImage('http://example.com');

  expect(result).toBe('mxc://example');
});

test('Returns URL from repository if the image already exists and is fresh', async () => {
  const repository = getRepository();
  repository.findByUrl = async (_url) => getImage(new Date(Date.now() + 10000));

  const uploader = new ImageUploader(getClient({
    content_uri: 'mxc://new',
  }), getOkDownloader(), repository);

  const result = await uploader.uploadImage('http://example.com');

  expect(result).toBe('mxc://existing');
});

test('Re-downloads image if it already exists but is stale', async () => {
  const repository = getRepository();
  repository.findByUrl = async (_url) => getImage(new Date(Date.now()));

  const uploader = new ImageUploader(getClient({
    content_uri: 'mxc://new',
  }), getOkDownloader(), repository);

  const result = await uploader.uploadImage('http://example.com');

  expect(result).toBe('mxc://new');
});

test('Updates cache if a stale image is revalidated', async () => {
  const repository: CachedImageRepository = {
    addOrUpdate: jest.fn(),
    findByUrl: async (_url) => getImage(new Date(Date.now())),
    updateCacheDetails: jest.fn(),
  };

  const uploader = new ImageUploader(getClient({
    content_uri: 'mxc://new',
  }), getNotModifiedDownloader(), repository);

  await uploader.uploadImage('http://example.com');

  expect(repository.addOrUpdate).toBeCalledTimes(0);
  expect(repository.updateCacheDetails).toBeCalledTimes(1);
});

test('Returns undefined if the image could not be downloaded', async () => {
  const repository = getRepository();

  const uploader = new ImageUploader(getClient({
    content_uri: 'mxc://new',
  }), getErrorDownloader(), repository);

  const result = await uploader.uploadImage('http://example.com');

  expect(result).toBeUndefined();
});

test('Updates cache if a redownloaded image evaluates to the same content hash', async () => {
  const repository: CachedImageRepository = {
    addOrUpdate: jest.fn(),
    findByUrl: async (_url) => getImage(new Date(Date.now())),
    updateCacheDetails: jest.fn(),
  };

  const uploader = new ImageUploader(getClient({
    content_uri: 'mxc://new',
  }), getOkDownloader('existing'), repository);

  await uploader.uploadImage('http://example.com');

  expect(repository.addOrUpdate).toBeCalledTimes(0);
  expect(repository.updateCacheDetails).toBeCalledTimes(1);
});
