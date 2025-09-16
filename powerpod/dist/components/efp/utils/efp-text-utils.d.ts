/**
 * EFP Text Utilities
 * Text formatting and manipulation utilities for EFP components
 * Extracted from EFPEntryForm.ts for better maintainability
 */
import { EFPChapterData } from '../types/efp-types.js';
export declare class EFPTextUtils {
    private static logger;
    /**
     * Format chapter title with proper prefixes and formatting
     * Handles both chapter objects and string names
     */
    static formatChapterTitle(chapterOrName: EFPChapterData | string | any): string;
    /**
     * Format string title (legacy support)
     */
    private static formatStringTitle;
    /**
     * Format parent chapter title
     */
    private static formatParentChapterTitle;
    /**
     * Format subchapter title
     */
    private static formatSubchapterTitle;
    /**
     * Convert string to title case
     */
    static toTitleCase(str: string): string;
    /**
     * Truncate text to specified length with ellipsis
     */
    static truncateText(text: string, maxLength: number): string;
    /**
     * Truncate text at word boundaries
     */
    static truncateAtWord(text: string, maxLength: number): string;
    /**
     * Clean HTML tags from text
     */
    static stripHtml(html: string): string;
    /**
     * Extract plain text from HTML with basic formatting preservation
     */
    static htmlToText(html: string, preserveLineBreaks?: boolean): string;
    /**
     * Decode common HTML entities
     */
    static decodeHtmlEntities(text: string): string;
    /**
     * Capitalize first letter of each word
     */
    static capitalizeWords(text: string): string;
    /**
     * Capitalize only the first letter of the string
     */
    static capitalizeFirst(text: string): string;
    /**
     * Convert camelCase or PascalCase to readable text
     */
    static camelToReadable(text: string): string;
    /**
     * Convert text to kebab-case
     */
    static toKebabCase(text: string): string;
    /**
     * Convert text to camelCase
     */
    static toCamelCase(text: string): string;
    /**
     * Generate a slug from text (URL-friendly)
     */
    static toSlug(text: string): string;
    /**
     * Pluralize a word based on count
     */
    static pluralize(word: string, count: number, pluralForm?: string): string;
    /**
     * Format a count with pluralized word
     */
    static formatCount(count: number, word: string, pluralForm?: string): string;
    /**
     * Escape HTML special characters
     */
    static escapeHtml(text: string): string;
    /**
     * Generate initials from a name
     */
    static getInitials(name: string, maxLength?: number): string;
    /**
     * Check if text contains only whitespace
     */
    static isWhitespace(text: string): boolean;
    /**
     * Remove extra whitespace and normalize line endings
     */
    static normalizeWhitespace(text: string): string;
    /**
     * Wrap text at specified width
     */
    static wrapText(text: string, width: number): string;
}
