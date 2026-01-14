import { LitElement, PropertyValues } from 'lit';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import type { EFPSection } from './efp/types.js';
/**
 * NavigationSidebar Component
 *
 * Displays workbook information and section navigation with completion status
 * Chapters are shown directly without tabs.
 * "Review & Submit" is displayed as a dedicated section below "My Action Plan".
 */
export declare class NavigationSidebar extends LitElement {
    workbookId: string;
    workbookName: string;
    workbookStatus: string;
    sections: EFPSection[];
    currentSectionIndex: number;
    sectionCompletion: Map<number, boolean>;
    sectionSkipped: Map<number, boolean>;
    paSigned: boolean;
    producerSigned: boolean;
    isPA: boolean;
    isProducer: boolean;
    static styles: import("lit").CSSResult;
    protected updated(changedProps: PropertyValues): void;
    private handleReviewSubmitClick;
    private isWorkbookComplete;
    private hasCurrentUserSignedOff;
    private getReviewSubmitIcon;
    private getReviewSubmitSubtitle;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'navigation-sidebar': NavigationSidebar;
    }
}
