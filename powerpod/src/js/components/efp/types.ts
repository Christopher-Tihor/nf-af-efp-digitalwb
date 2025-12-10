export interface EFPStep {
  label: string;
  content: string;
  complete?: boolean;
  sectionIndex: number;
  chapterId?: string; // Chapter ID for direct lookup in questionnaire store
  chapterData?: any;
  subchapterData?: any;
  isContainer?: boolean;
  hideSkipChapterCheckbox?: boolean; // If true, the "This section does not apply" checkbox will be hidden
}

export interface EFPSectionItem {
  label: string;
  content?: string;
  complete?: boolean;
  items?: EFPSectionItem[];
  title?: string;
  isContainer?: boolean;
  chapterData?: any;
  subchapterData?: any;
  questionId?: string;
  chapterId?: string;
  disableExpand?: boolean; // If true, item will not be expandable even if it has items
  hideSkipChapterCheckbox?: boolean; // If true, the "This section does not apply" checkbox will be hidden
}

export interface EFPSection {
  tab: string;
  title: string;
  items: EFPSectionItem[];
}

export interface QuestionsAndResponsesEntry {
  question: any | null;
  response: any | null;
}

export interface QuestionsAndResponsesMemory {
  questionsWithResponses: Map<string, QuestionsAndResponsesEntry>;
  questionsByChapter: Map<string, QuestionsAndResponsesEntry[]>;
  stats: {
    totalQuestions: number;
    answeredQuestions: number;
    unansweredQuestions: number;
    completionPercentage: number;
    lastUpdated: string | null;
  };
  isLoaded: boolean;
  isLoading: boolean;
  workbookId: string | null;
  lastUpdated: string | null;
  error: string | null;
}
