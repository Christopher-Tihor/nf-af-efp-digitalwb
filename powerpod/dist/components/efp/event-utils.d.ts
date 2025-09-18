import { EFPStep, EFPSectionItem } from './types.js';
export declare class EFPEventUtils {
    static handleItemClick(item: EFPSectionItem, flatSteps: EFPStep[], onStepChange: (stepIndex: number, sectionIndex: number) => void, onNavigationUpdate: (label: string) => void): void;
    static handleSectionChange(newSectionIndex: number, isNavigating: boolean, flatSteps: EFPStep[], onStepChange: (stepIndex: number, sectionIndex: number) => void, onNavigationUpdate: (label: string) => void): void;
    static handleRatingChanged(event: CustomEvent, onAnswerUpdate?: (questionId: string, value: any) => void): void;
    static handleNavigationPrevious(goToPrevious: () => void): void;
    static handleNavigationSkip(event: CustomEvent, onSectionChange: (sectionIndex: number) => void): void;
    static handleNavigationContinue(goToNext: () => void): void;
    static createTabShowHandler(onSectionChange: (newSectionIndex: number) => void): (e: CustomEvent) => void;
    static createItemClickHandler(flatSteps: EFPStep[], onStepChange: (stepIndex: number, sectionIndex: number) => void, onNavigationUpdate: (label: string) => void): (item: EFPSectionItem) => void;
}
