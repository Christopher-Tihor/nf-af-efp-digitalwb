/**
 * EFP Section Generator Utilities
 * Content generation and rendering utilities for EFP sections
 * Extracted from EFPEntryForm.ts for better maintainability
 */
import { EFPChapterData, EFPSectionItem, EFPSection } from '../types/efp-types.js';
export declare class EFPSectionGenerator {
    private static logger;
    /**
     * Render content for a subchapter
     */
    static renderSubchapterContent(subchapter: EFPChapterData | any): string;
    /**
     * Render content for a main chapter
     */
    static renderChapterContent(chapter: EFPChapterData | any): string;
    /**
     * Generate container content for parent items
     */
    static renderContainerContent(title: string, description?: string): string;
    /**
     * Generate introduction content
     */
    static renderIntroductionContent(title: string, description: string): string;
    /**
     * Generate loading content placeholder
     */
    static renderLoadingContent(): string;
    /**
     * Generate error content
     */
    static renderErrorContent(error: string): string;
    /**
     * Generate empty state content
     */
    static renderEmptyContent(message?: string): string;
    /**
     * Generate section items from questionnaire chapters
     */
    static generateSectionItems(chapters: EFPChapterData[]): EFPSectionItem[];
    /**
     * Generate subchapter items
     */
    private static generateSubchapterItems;
    /**
     * Generate question items
     */
    private static generateQuestionItems;
    /**
     * Generate content for a question
     */
    private static renderQuestionContent;
    /**
     * Generate default sections structure
     */
    static generateDefaultSections(): EFPSection[];
    /**
     * Update section items with completion status
     */
    static updateSectionItemsCompletion(items: EFPSectionItem[], completionMap: Map<string, boolean>): EFPSectionItem[];
    /**
     * Validate section structure
     */
    static validateSectionStructure(sections: EFPSection[]): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
    };
    /**
     * Validate section items recursively
     */
    private static validateItems;
}
