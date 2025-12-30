import { EFPSectionItem } from './types.js';
export declare class EFPSectionGenerator {
    static renderSubchapterContent(subchapter: any): string;
    static renderSubchapterContainerContent(subchapter: any): string;
    static renderChapterContent(chapter: any): string;
    static renderChapterContainerContent(chapter: any): string;
    static getSectionBItemsFromStore(): EFPSectionItem[];
    static getMyActionPlanItemsFromPortalPage(): EFPSectionItem;
    static getSectionCItemsFromPortalPage(): EFPSectionItem[];
    static getAllLeafItems(items: EFPSectionItem[]): EFPSectionItem[];
}
