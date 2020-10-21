import { Headers } from 'node-fetch';
import UploadedImageRepository from '../repositories/UploadedImageRepository';
import ImageUploader, { DownloadResponse, UploadClient } from './ImageUploader';

type UploadResponse =
  | { content_uri: string }
  | undefined;

function getClient(response?: UploadResponse): UploadClient {
  return {
    uploadContent: async (_rq) => JSON.stringify(response),
  };
}

function getDownloader(contentType?: string | undefined):
(url: string) => Promise<DownloadResponse> {
  let headers = new Headers();
  if (contentType) {
    headers = new Headers({
      'Content-Type': contentType,
    });
  }
  return async (_url: string) => ({
    headers,
    buffer: async () => Buffer.from('test'),
  });
}

function getRepository(): UploadedImageRepository {
  return undefined as unknown as UploadedImageRepository;
}

test('Returns correct content URL', async () => {
  const uploader = new ImageUploader(getClient({
    content_uri: 'mxc://example',
  }), getDownloader(), getRepository());

  const result = await uploader.uploadImage('test', 'http://example.com');

  expect(result).toBe('mxc://example');
});
