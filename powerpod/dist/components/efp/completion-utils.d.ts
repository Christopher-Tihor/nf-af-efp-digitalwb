import { EFPSection, EFPSectionItem } from './types.js';
export interface CompletionContext {
    hasTriedToSubmit: boolean;
    getQuestionsForChapter: (chapterId: string, excludePreventSkipping?: boolean) => any[];
}
export declare class EFPCompletionUtils {
    static calculateOverallCompletion(sections: EFPSection[]): number;
    static isSectionComplete(section: EFPSection): boolean;
    /**
     * Get completion status for an item from the questionnaire store
     */
    static getCompletionFromStore(item: any): boolean;
    /**
     * Get section completion status from questionnaire store
     */
    static getSectionCompletionFromStore(section: any): boolean;
    /**
     * Get section skipped status from questionnaire store
     */
    static getSectionSkippedFromStore(section: any): boolean;
    /**
     * Check if a chapter has incomplete questions from preventSkipping children
     */
    static hasIncompletePreventSkippingChildren(subchapters: any[]): boolean;
    /**
     * Check if a chapter is skipped by ID
     */
    static isChapterSkippedById(chapterId: string, getQuestionsForChapter: (chapterId: string, excludePreventSkipping?: boolean) => any[]): boolean;
    /**
     * Check if an item has any questions (directly or in nested subchapters)
     * Duplicated from EFPRenderUtils to avoid circular dependency
     */
    private static itemHasQuestions;
    /**
     * Check if a subchapter (from data model) is skipped
     */
    private static isSubchapterSkipped;
    /**
     * Get skipped status for an item from the store
     *
     * For parent chapters with subchapters:
     * - Show as skipped ONLY if ALL subchapters (with questions) are skipped
     * - Items without questions are ignored when determining parent status
     * - If some subchapters are skipped but others are not, show as complete (not skipped)
     *
     * For leaf chapters (no subchapters):
     * - Show as skipped if all questions are skipped
     */
    static getSkippedFromStore(item: EFPSectionItem, getQuestionsForChapter: (chapterId: string, excludePreventSkipping?: boolean) => any[]): boolean;
    /**
     * Get incomplete status for an item from the store
     */
    static getIncompleteFromStore(item: EFPSectionItem, ctx: CompletionContext): boolean;
}
