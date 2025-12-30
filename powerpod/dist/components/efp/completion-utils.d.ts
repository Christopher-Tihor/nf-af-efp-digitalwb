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
     * Get skipped status for an item from the store
     */
    static getSkippedFromStore(item: EFPSectionItem, getQuestionsForChapter: (chapterId: string, excludePreventSkipping?: boolean) => any[]): boolean;
    /**
     * Get incomplete status for an item from the store
     */
    static getIncompleteFromStore(item: EFPSectionItem, ctx: CompletionContext): boolean;
}
