import { EFPStep, EFPSection, EFPSectionItem, EFPSelectableStep } from './types';
export declare class EFPNavigationUtils {
    static isStepContainer(step: EFPStep, sections: EFPSection[]): boolean;
    static findLastSelectableStepInSection(sectionIndex: number, flatSteps: EFPStep[], sections: EFPSection[]): EFPSelectableStep | null;
    static findFirstSelectableStepInSection(sectionIndex: number, flatSteps: EFPStep[], sections: EFPSection[]): EFPSelectableStep | null;
    static findContainersForItem(itemLabel: string, sections: EFPSection[]): string[];
    static itemExistsInChildren(items: EFPSectionItem[], targetLabel: string): boolean;
    private static getFlatStepsFromSections;
}
