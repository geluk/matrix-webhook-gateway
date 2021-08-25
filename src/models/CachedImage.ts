export default interface CachedImage {
  url_hash: string;
  original_url: string;
  matrix_url: string;
  last_retrieved: Date;
  content_hash: string;
  cache_details: CacheDetails | null;
}

export interface CacheDetails {
  etag: string | null,
  revalidateAfter: Date,
}
