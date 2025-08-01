import { EFPStep, EFPSection } from '../types/EFPTypes';
export declare class EFPDataManager {
    private nestedChapterStructure;
    constructor();
    updateNestedChapterStructure(nestedStructure: any[]): void;
    getSections(): EFPSection[];
    private generateSectionBItems;
    private formatChapterTitle;
    private renderChapterContent;
    getFlatSteps(sections: EFPSection[]): EFPStep[];
    isSectionComplete(section: EFPSection): boolean;
    getCompletionPercent(sections: EFPSection[]): number;
}
