/**
 * EFP Completion Utilities
 * Utilities for calculating completion status and progress
 * Extracted from EFPEntryForm.ts for better maintainability
 */
import { EFPSection, EFPSectionItem, EFPStep, EFPCompletionStats, EFPChapterData, EFPQuestionData } from '../types/efp-types.js';
export declare class EFPCompletionUtils {
    private static logger;
    /**
     * Calculate overall completion percentage across all sections
     */
    static calculateOverallCompletion(sections: EFPSection[]): number;
    /**
     * Check if a section is completely finished
     */
    static isSectionComplete(section: EFPSection): boolean;
    /**
     * Calculate completion percentage for a specific section
     */
    static calculateSectionCompletion(section: EFPSection): number;
    /**
     * Get detailed completion statistics
     */
    static getCompletionStats(sections: EFPSection[]): EFPCompletionStats;
    /**
     * Calculate completion for steps array
     */
    static calculateStepsCompletion(steps: EFPStep[]): number;
    /**
     * Check if a chapter is complete based on its questions
     */
    static isChapterComplete(chapter: EFPChapterData): boolean;
    /**
     * Check if a question is complete (has a response)
     */
    static isQuestionComplete(question: EFPQuestionData): boolean;
    /**
     * Calculate completion percentage for a chapter
     */
    static calculateChapterCompletion(chapter: EFPChapterData): number;
    /**
     * Get detailed statistics for a chapter
     */
    static getChapterStats(chapter: EFPChapterData): EFPCompletionStats;
    /**
     * Find the next incomplete item in sections
     */
    static findNextIncompleteItem(sections: EFPSection[]): EFPSectionItem | null;
    /**
     * Find the next incomplete step
     */
    static findNextIncompleteStep(steps: EFPStep[]): EFPStep | null;
    /**
     * Get completion progress as a fraction (0-1)
     */
    static getCompletionFraction(sections: EFPSection[]): number;
    /**
     * Check if completion meets a minimum threshold
     */
    static meetsCompletionThreshold(sections: EFPSection[], threshold: number): boolean;
    /**
     * Get sections grouped by completion status
     */
    static groupSectionsByCompletion(sections: EFPSection[]): {
        complete: EFPSection[];
        incomplete: EFPSection[];
        empty: EFPSection[];
    };
    /**
     * Collect all leaf items (items without children) from sections
     */
    private static collectAllItems;
    /**
     * Collect leaf items from a list of items (recursive)
     */
    private static collectLeafItems;
    /**
     * Find the first incomplete item in a list of items (recursive)
     */
    private static findIncompleteInItems;
    /**
     * Update completion status for an item and propagate to parents
     */
    static updateItemCompletion(sections: EFPSection[], itemId: string, isComplete: boolean): EFPSection[];
    /**
     * Validate completion data consistency
     */
    static validateCompletionData(sections: EFPSection[]): {
        isValid: boolean;
        errors: string[];
    };
    /**
     * Validate items array recursively
     */
    private static validateItems;
}
