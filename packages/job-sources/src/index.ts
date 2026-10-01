export interface JobSourceAdapter {
  name: string;
  import(url: string): Promise<unknown>;
}

