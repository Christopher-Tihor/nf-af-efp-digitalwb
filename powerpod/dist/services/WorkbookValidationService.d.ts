import { ChapterManagementService } from './ChapterManagementService.js';
export interface IncompleteChapter {
    chapterId: string;
    chapterName: string;
    totalQuestions: number;
    answeredQuestions: number;
}
/**
 * Service responsible for workbook validation
 * Handles completion checking, validation rules, and access control
 */
export declare class WorkbookValidationService {
    private chapterService;
    constructor(chapterService: ChapterManagementService);
    /**
     * Clean up all state
     */
    cleanup(): void;
    /**
     * Check if user can access Review & Submit
     * Returns true if all questions are answered or their chapters are skipped
     */
    canAccessReviewAndSubmit(): boolean;
    /**
     * Get list of incomplete chapters (chapters with unanswered questions that are not skipped)
     */
    getIncompleteChapters(): IncompleteChapter[];
    /**
     * Calculate overall workbook completion percentage
     * Skipped questions are excluded from the calculation
     */
    calculateCompletionPercentage(): number;
    /**
     * Validate if a question is answered
     */
    isQuestionAnswered(questionId: string): boolean;
    /**
     * Validate if all questions in a chapter are answered (or chapter is skipped)
     */
    isChapterComplete(chapterId: string): boolean;
    /**
     * Get validation summary for the entire workbook
     */
    getValidationSummary(): {
        totalChapters: number;
        completeChapters: number;
        incompleteChapters: number;
        skippedChapters: number;
        totalQuestions: number;
        answeredQuestions: number;
        completionPercentage: number;
        canSubmit: boolean;
    };
}
