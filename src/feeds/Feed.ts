export interface Feed {
  url: string;
  cursor?: string;
}

export interface Item {
  title: string;
  content?: string;
  link: string;
}
