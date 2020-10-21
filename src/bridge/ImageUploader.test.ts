import { Headers } from 'node-fetch';
import { UploadedImageRepository } from '../repositories/UploadedImageRepository';
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

test('Returns correct content URL', async () => {
  const repository: UploadedImageRepository = {
    add: async (_image) => undefined,
    find: async (_hash) => undefined,
  };

  const uploader = new ImageUploader(getClient({
    content_uri: 'mxc://example',
  }), getDownloader(), repository);

  const result = await uploader.uploadImage('test', 'http://example.com');

  expect(result).toBe('mxc://example');
});

test('Returns URL from repository if the image already exists', async () => {
  const repository: UploadedImageRepository = {
    add: async (_image) => undefined,
    find: async (_hash) => ({
      hash: '',
      matrix_url: 'mxc://existing',
      original_url: '',
    }),
  };

  const uploader = new ImageUploader(getClient({
    content_uri: 'mxc://new',
  }), getDownloader(), repository);

  const result = await uploader.uploadImage('test', 'http://example.com');

  expect(result).toBe('mxc://existing');
});

test('Stores the hash of the downloaded image in the repository', async () => {
  const add = jest.fn();
  const repository: UploadedImageRepository = {
    add,
    find: async (_hash) => undefined,
  };

  const uploader = new ImageUploader(getClient({
    content_uri: 'mxc://new',
  }), getDownloader(), repository);

  await uploader.uploadImage('test', 'http://example.com');

  expect(add).toBeCalled();
});
