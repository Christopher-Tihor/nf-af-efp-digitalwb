import { TemplateResult } from 'lit';
import { EFPStep, EFPActiveContent, EFPSectionItem } from './types';
export declare class EFPRenderUtils {
    static renderMainContent(currentSectionIndex: number, flatSteps: EFPStep[], currentStepIndex: number, activeContent: EFPActiveContent, html: any, unsafeHTML: any, renderSubchapter: (subchapterData: any) => any, renderChapter: (chapterData: any) => any): any;
    static renderItems(items: EFPSectionItem[], html: any, activeContentTitle: string, onItemClick: (item: EFPSectionItem) => void, renderItems: (items: EFPSectionItem[]) => any): any;
    static renderProgressBar(completionPercent: number, html: any): TemplateResult;
    static renderSectionTabs(sections: any[], currentSectionIndex: number, isSectionComplete: (section: any) => boolean, onTabShow: (e: CustomEvent) => void, html: any): TemplateResult;
    static renderContainerMessage(html: any): TemplateResult;
}
