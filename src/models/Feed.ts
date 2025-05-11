import CacheDetails from "../models/CacheDetails";

export interface Feed {
  url: string;
  cursor?: string;
  cache_details: CacheDetails | undefined;
}

export interface Item {
  title: string;
  content?: string;
  link: string;
}
