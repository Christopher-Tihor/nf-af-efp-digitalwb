/**
 * EFP Navigation Renderer
 * Navigation UI rendering utilities for EFP components
 * Extracted from EFPEntryForm.ts for better maintainability
 */
import { TemplateResult } from 'lit';
import { EFPSection, EFPSectionItem, EFPStep } from '../types/efp-types.js';
export declare class EFPNavigationRenderer {
    private static logger;
    /**
     * Render sidebar navigation with sections and items
     */
    static renderSidebar(sections: EFPSection[], currentSectionIndex: number, onSectionChange: (index: number) => void, getSectionCompletionFromStore: (section: EFPSection) => boolean): TemplateResult;
    /**
     * Render navigation items recursively
     */
    static renderItems(items: EFPSectionItem[]): TemplateResult;
    /**
     * Render a single navigation item
     */
    static renderItem(item: EFPSectionItem): TemplateResult;
    /**
     * Render progress bar
     */
    static renderProgressBar(completionPercent: number, isLoaded?: boolean, stats?: {
        totalQuestions: number;
        answeredQuestions: number;
    }): TemplateResult;
    /**
     * Render breadcrumbs component
     */
    static renderBreadcrumbs(currentStep: EFPStep | undefined, currentSection: EFPSection | undefined, currentSectionIndex: number, currentStepIndex: number, flatSteps: EFPStep[], sections: EFPSection[], onBreadcrumbNavigate: (event: CustomEvent) => void): TemplateResult;
    /**
     * Render navigation buttons
     */
    static renderNavigationButtons(isPreviousDisabled: boolean, isContinueDisabled: boolean, sectionsLength: number, onPrevious: () => void, onSkip: () => void, onContinue: () => void): TemplateResult;
    /**
     * Render section tabs
     */
    static renderSectionTabs(sections: EFPSection[], currentSectionIndex: number, onTabShow: (event: CustomEvent) => void, getSectionCompletionFromStore: (section: EFPSection) => boolean): TemplateResult;
    /**
     * Render step indicator
     */
    static renderStepIndicator(currentStepIndex: number, totalSteps: number, currentStep?: EFPStep): TemplateResult;
    /**
     * Render section summary
     */
    static renderSectionSummary(section: EFPSection): TemplateResult;
    /**
     * Render navigation menu (mobile-friendly)
     */
    static renderNavigationMenu(sections: EFPSection[], currentSectionIndex: number, onSectionSelect: (index: number) => void): TemplateResult;
    /**
     * Render quick navigation (jump to section/step)
     */
    static renderQuickNavigation(sections: EFPSection[], flatSteps: EFPStep[], currentStepIndex: number, onNavigate: (stepIndex: number) => void): TemplateResult;
    /**
     * Render navigation help/instructions
     */
    static renderNavigationHelp(): TemplateResult;
    /**
     * Render debug navigation info (development only)
     */
    static renderDebugInfo(currentSectionIndex: number, currentStepIndex: number, sections: EFPSection[], flatSteps: EFPStep[]): TemplateResult;
}
