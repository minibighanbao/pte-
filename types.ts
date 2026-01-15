
export interface Sentence {
  id: string;
  english: string;
  chinese: string;
  segments: string[];
  tips?: string;
  versions?: string[];
  difficulty: 1 | 2 | 3;
}

export enum AppMode {
  LEARN = 'LEARN',
  PRACTICE = 'PRACTICE',
  BROWSE = 'BROWSE'
}
