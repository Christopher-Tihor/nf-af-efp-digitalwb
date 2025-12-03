export interface EFPStep {
    label: string;
    content: string;
    complete?: boolean;
    sectionIndex: number;
    chapterData?: any;
    subchapterData?: any;
    isContainer?: boolean;
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
    disableExpand?: boolean;
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
