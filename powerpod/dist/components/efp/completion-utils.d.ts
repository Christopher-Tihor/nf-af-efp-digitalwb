import { EFPSection, EFPSectionItem } from './types';
export declare class EFPCompletionUtils {
    static calculateOverallCompletion(sections: EFPSection[]): number;
    static isSectionComplete(section: EFPSection): boolean;
    static getSectionProgress(section: EFPSection): {
        completed: number;
        total: number;
        percentage: number;
    };
    static getNextIncompleteItem(section: EFPSection): EFPSectionItem | null;
}
