export interface EFPStep {
    label: string;
    content: string;
    complete?: boolean;
    sectionIndex: number;
    chapterData?: any;
    subchapterData?: any;
    isContainer?: boolean;
    hideSkipChapterCheckbox?: boolean;
}
export interface EFPActiveContent {
    title: string;
    content: string;
}
export declare class EFPLifecycleUtils {
    static handleStepIndexChange(currentStepIndex: number, flatSteps: EFPStep[], activeContent: EFPActiveContent, onContentUpdate: (newContent: EFPActiveContent) => void, onNavigationUpdate?: (label: string) => void): boolean;
    static handleSectionIndexChange(currentSectionIndex: number, tabGroupEl: any, onTabUpdate?: () => void): void;
    static shouldRequestUpdate(changedProps: Map<string, unknown>, watchedProps: string[]): boolean;
}
