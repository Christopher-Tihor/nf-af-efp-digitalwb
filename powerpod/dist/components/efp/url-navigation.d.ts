/**
 * URL Navigation Utility
 *
 * Provides robust URL-based navigation for the EFP workbook.
 * Uses stable IDs (GUIDs) for chapters/subchapters and named sections.
 *
 * URL Format:
 * - ?section=my-workbook&chapterId=abc-123-def
 * - ?section=my-workbook&step=my-action-plan
 * - ?section=review-submit
 */
import { EFPStep, EFPSection } from './types.js';
export interface URLNavigationParams {
    section?: string;
    chapterId?: string;
    subchapterId?: string;
    step?: string;
    stepIndex?: number;
}
export interface NavigationTarget {
    stepIndex: number;
    sectionIndex: number;
    step: EFPStep;
}
/**
 * Parse current URL for navigation parameters
 */
export declare function parseNavigationURL(): URLNavigationParams;
/**
 * Convert a label to a URL-safe slug
 */
export declare function labelToSlug(label: string): string;
/**
 * Update the URL with current navigation state
 * Uses replaceState by default, pushState if addToHistory is true
 */
export declare function updateNavigationURL(stepIndex: number, sectionIndex: number, flatSteps: EFPStep[], addToHistory?: boolean): void;
/**
 * Resolve URL params to a navigation target
 * Uses fallback chain: chapterId → subchapterId → step slug → stepIndex
 */
export declare function resolveNavigationFromURL(params: URLNavigationParams, flatSteps: EFPStep[], sections: EFPSection[], canAccessReviewAndSubmit: () => boolean): NavigationTarget | null;
/**
 * Check if URL has navigation params
 */
export declare function hasNavigationParams(): boolean;
/**
 * Clear navigation params from URL (preserves other params like 'id')
 */
export declare function clearNavigationParams(): void;
