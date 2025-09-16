/**
 * EFP Navigation Utilities
 * Navigation logic and step management for EFP components
 * Extracted from EFPEntryForm.ts for better maintainability
 */
import { EFPStep, EFPSection, EFPNavigationState } from '../types/efp-types.js';
export declare class EFPNavigationUtils {
    private static logger;
    /**
     * Check if a step is a container (non-selectable parent item)
     */
    static isStepContainer(step: EFPStep, sections: EFPSection[]): boolean;
    /**
     * Find the last selectable step in a section
     */
    static findLastSelectableStepInSection(sectionIndex: number, flatSteps: EFPStep[], sections: EFPSection[]): {
        step: EFPStep;
        index: number;
    } | null;
    /**
     * Find the first selectable step in a section
     */
    static findFirstSelectableStepInSection(sectionIndex: number, flatSteps: EFPStep[], sections: EFPSection[]): {
        step: EFPStep;
        index: number;
    } | null;
    /**
     * Get flat array of steps from sections
     */
    static getFlatStepsFromSections(sections: EFPSection[]): EFPStep[];
    /**
     * Collect steps from section items recursively
     */
    private static collectStepsFromItems;
    /**
     * Find the next selectable step
     */
    static findNextSelectableStep(currentIndex: number, flatSteps: EFPStep[], sections: EFPSection[]): number | null;
    /**
     * Find the previous selectable step
     */
    static findPreviousSelectableStep(currentIndex: number, flatSteps: EFPStep[], sections: EFPSection[]): number | null;
    /**
     * Navigate to a specific step by index
     */
    static navigateToStep(targetIndex: number, flatSteps: EFPStep[], sections: EFPSection[]): {
        stepIndex: number;
        sectionIndex: number;
    } | null;
    /**
     * Navigate to a specific section
     */
    static navigateToSection(targetSectionIndex: number, flatSteps: EFPStep[], sections: EFPSection[]): {
        stepIndex: number;
        sectionIndex: number;
    } | null;
    /**
     * Handle section index change with tab synchronization
     */
    static handleSectionIndexChange(currentSectionIndex: number, tabGroupEl: any, onTabUpdate?: () => void): void;
    /**
     * Check if component should request update based on changed properties
     */
    static shouldRequestUpdate(changedProps: Map<string, unknown>, watchedProps: string[]): boolean;
    /**
     * Get navigation state summary
     */
    static getNavigationState(currentSectionIndex: number, currentStepIndex: number, flatSteps: EFPStep[], sections: EFPSection[]): EFPNavigationState & {
        canGoNext: boolean;
        canGoPrevious: boolean;
        currentStep?: EFPStep;
        currentSection?: EFPSection;
    };
    /**
     * Validate navigation indices
     */
    static validateNavigationIndices(sectionIndex: number, stepIndex: number, sections: EFPSection[], flatSteps: EFPStep[]): {
        isValid: boolean;
        errors: string[];
    };
    /**
     * Get breadcrumb trail for current navigation state
     */
    static getBreadcrumbTrail(currentStepIndex: number, flatSteps: EFPStep[], sections: EFPSection[]): Array<{
        label: string;
        stepIndex: number;
        sectionIndex: number;
    }>;
}
