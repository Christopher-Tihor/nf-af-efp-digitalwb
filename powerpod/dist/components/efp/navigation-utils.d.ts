export interface EFPStep {
    label: string;
    content: string;
    complete?: boolean;
    sectionIndex: number;
    chapterData?: any;
    subchapterData?: any;
    isContainer?: boolean;
}
export interface EFPSection {
    tab: string;
    title: string;
    items: EFPSectionItem[];
}
export interface EFPSectionItem {
    label: string;
    content?: string;
    complete?: boolean;
    items?: EFPSectionItem[];
    title?: string;
    isContainer?: boolean;
    chapterData?: any;
    subchapterData?: any;
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
    private static getFlatStepsFromSections;
}
