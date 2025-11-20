export enum Genre {
  FANTASY = 'خيال',
  SCI_FI = 'خيال علمي',
  MYSTERY = 'غموض',
  ROMANCE = 'رومانسي',
  HISTORICAL = 'تاريخي',
  DRAMA = 'دراما',
  HORROR = 'رعب',
  ADVENTURE = 'مغامرة',
}

export enum Tone {
  SERIOUS = 'جاد',
  HUMOROUS = 'فكاهي',
  DARK = 'مظلم',
  OPTIMISTIC = 'متفائل',
  MYSTERIOUS = 'غامض',
}

export interface NovelConfig {
  title: string;
  genre: Genre;
  tone: Tone;
  protagonist: string;
  setting: string;
  plotSummary: string;
  targetAudience: string;
}

export interface Chapter {
  id: number;
  title: string;
  summary: string;
  content?: string; // Content is undefined until generated
  isGenerating?: boolean;
}

export interface NovelData {
  config: NovelConfig;
  outline: Chapter[];
  currentChapterIndex: number;
}

export enum AppState {
  SETUP = 'SETUP',
  GENERATING_OUTLINE = 'GENERATING_OUTLINE',
  READING = 'READING',
}