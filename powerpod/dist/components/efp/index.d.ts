export * from './types';
export { EFPLogger } from './logger';
export { EFPTextUtils } from './text-utils';
export { EFPCompletionUtils } from './completion-utils';
export { EFPSectionGenerator } from './section-generator';
export { EFPNavigationUtils } from './navigation-utils';
export { EFPRenderUtils } from './render-utils';
export { EFPEventUtils } from './event-utils';
export { EFPLifecycleUtils } from './lifecycle-utils';
export type { EFPStep, EFPSection, EFPSectionItem, EFPActiveContent, EFPNavigationState, EFPSelectableStep, EFPChapterData, EFPQuestion } from './types';
export declare const EFP_UTILS_VERSION = "1.0.0";
export declare const EFP_DEFAULT_CONFIG: {
    debug: boolean;
    maxNavigationHistory: number;
    autoSave: boolean;
    autoSaveInterval: number;
};
export declare function initializeEFPUtils(config?: Partial<typeof EFP_DEFAULT_CONFIG>): {
    debug: boolean;
    maxNavigationHistory: number;
    autoSave: boolean;
    autoSaveInterval: number;
};
export declare function createEFPStep(label: string, content: string, sectionIndex: number, options?: any): any;
export declare function createEFPSection(tab: string, title: string, items?: any[]): any;
export declare function createEFPSectionItem(label: string, options?: any): any;
