import { TemplateResult } from 'lit';
import { EFPStep, EFPActiveContent, EFPSection, EFPSectionItem } from '../types/EFPTypes';
export declare class EFPContentRenderer {
    private currentSectionIndex;
    private currentStepIndex;
    private flatSteps;
    private activeContent;
    constructor(currentSectionIndex: number, currentStepIndex: number, flatSteps: EFPStep[], activeContent: EFPActiveContent);
    updateState(currentSectionIndex: number, currentStepIndex: number, flatSteps: EFPStep[], activeContent: EFPActiveContent): void;
    renderMainContent(): TemplateResult;
    renderChapter(chapter: any): TemplateResult;
    renderSubchapter(subchapter: any): TemplateResult;
    renderSubSubchapter(subSubchapter: any): TemplateResult;
    renderQuestion(question: any): TemplateResult;
    renderQuestionsWithPagination(questions: any[]): TemplateResult;
    renderItems(items: EFPSectionItem[], onItemClick: (item: EFPSectionItem) => void): TemplateResult[];
    renderSectionTabs(sections: EFPSection[], currentSectionIndex: number, isSectionComplete: (section: EFPSection) => boolean, onTabShow: (e: CustomEvent) => void, onItemClick: (item: EFPSectionItem) => void): TemplateResult;
    renderProgressBar(completionPercent: number): TemplateResult;
    renderNavigationButtons(isPreviousDisabled: boolean, isContinueDisabled: boolean, sectionsLength: number, onPrevious: () => void, onSkip: (event: CustomEvent) => void, onContinue: () => void): TemplateResult;
    private getCurrentStepIndex;
    private handleRatingChanged;
}
