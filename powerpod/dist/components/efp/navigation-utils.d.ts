import { EFPStep, EFPSection, EFPSectionItem } from './types.js';
export interface NavigationContext {
    currentStepIndex: number;
    flatSteps: EFPStep[];
    sections: EFPSection[];
    activeContentTitle: string;
    canAccessReviewAndSubmit: boolean;
    getQuestionsForChapter: (chapterId: string) => any[];
}
export interface NavigationResult {
    success: boolean;
    newStepIndex?: number;
    newSectionIndex?: number;
    newActiveContent?: {
        title: string;
        content: string;
    };
    scrollToTop?: boolean;
    scrollToQuestion?: {
        questionId: string;
    };
    showIncompleteAlert?: boolean;
    errorMessage?: string;
}
export declare class EFPNavigationUtils {
    static isStepContainer(step: EFPStep, sections: EFPSection[]): boolean;
    static findLastSelectableStepInSection(sectionIndex: number, flatSteps: EFPStep[], sections: EFPSection[]): {
        step: EFPStep;
        index: number;
    } | null;
    static findFirstSelectableStepInSection(sectionIndex: number, flatSteps: EFPStep[], sections: EFPSection[]): {
        step: EFPStep;
        index: number;
    } | null;
    static findContainersForItem(itemLabel: string, sections: EFPSection[]): string[];
    static itemExistsInChildren(items: EFPSectionItem[], targetLabel: string): boolean;
    static getFlatStepsFromSections(sections: EFPSection[]): EFPStep[];
    static findNextSelectableStep(currentIndex: number, flatSteps: EFPStep[], sections: EFPSection[]): number | null;
    static findPreviousSelectableStep(currentIndex: number, flatSteps: EFPStep[], sections: EFPSection[]): number | null;
    static navigateToStep(targetIndex: number, flatSteps: EFPStep[], sections: EFPSection[]): {
        stepIndex: number;
        sectionIndex: number;
    } | null;
    static navigateToSection(targetSectionIndex: number, flatSteps: EFPStep[], sections: EFPSection[]): {
        stepIndex: number;
        sectionIndex: number;
    } | null;
    /**
     * Resolves the current step index when it's -1 by matching active content title
     */
    static resolveCurrentStepIndex(ctx: NavigationContext): number;
    /**
     * Calculate the next navigation result (for goToNext)
     */
    static calculateNextNavigation(ctx: NavigationContext): NavigationResult;
    /**
     * Calculate the previous navigation result (for goToPrevious)
     */
    static calculatePreviousNavigation(ctx: NavigationContext): NavigationResult;
    /**
     * Find the next required step (earliest unanswered, non-skipped question)
     */
    static findNextRequiredStep(ctx: NavigationContext): {
        stepIndex: number;
        questionId: string;
    } | null;
    /**
     * Calculate navigation skip result (for handleNavigationSkip)
     */
    static calculateSkipNavigation(ctx: NavigationContext): NavigationResult;
}
