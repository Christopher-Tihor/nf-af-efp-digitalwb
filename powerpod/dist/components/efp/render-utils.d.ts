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
export interface EFPSectionItem {
    label: string;
    content?: string;
    complete?: boolean;
    items?: EFPSectionItem[];
    title?: string;
    disableExpand?: boolean;
}
export declare class EFPRenderUtils {
    static renderMainContent(currentSectionIndex: number, flatSteps: EFPStep[], currentStepIndex: number, activeContent: EFPActiveContent, html: any, unsafeHTML: any, renderSubchapter: (subchapterData: any) => any, renderChapter: (chapterData: any) => any, renderContainerSubchapter: (subchapterData: any) => any, renderContainerChapter: (chapterData: any) => any): any;
    static renderItems(items: EFPSectionItem[], html: any, activeContentTitle: string, onItemClick: (item: EFPSectionItem) => void, renderItems: (items: EFPSectionItem[]) => any, getCompletion?: (item: EFPSectionItem) => boolean, getSkipped?: (item: EFPSectionItem) => boolean): any;
}
