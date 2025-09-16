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
export declare class EFPCompletionUtils {
    static calculateOverallCompletion(sections: EFPSection[]): number;
    static isSectionComplete(section: EFPSection): boolean;
}
