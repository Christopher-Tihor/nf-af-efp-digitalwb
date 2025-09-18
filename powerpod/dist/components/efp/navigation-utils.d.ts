import { EFPStep, EFPSection, EFPSectionItem } from './types.js';
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
}
