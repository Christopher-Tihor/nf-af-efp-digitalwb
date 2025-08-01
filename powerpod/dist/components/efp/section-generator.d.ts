import { EFPSectionItem } from './types';
export declare class EFPSectionGenerator {
    static generateSectionBItems(nestedChapterStructure: any[]): EFPSectionItem[];
    static renderSubchapterContent(subchapter: any): string;
    static renderChapterContent(chapter: any): string;
}
