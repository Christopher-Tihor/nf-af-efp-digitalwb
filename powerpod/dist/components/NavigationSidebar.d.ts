import { LitElement, PropertyValues } from 'lit';
import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js';
import '@shoelace-style/shoelace/dist/components/tab/tab.js';
import '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import type { EFPSection } from './efp/types.js';
/**
 * NavigationSidebar Component
 *
 * Displays workbook information and section navigation with completion status
 */
export declare class NavigationSidebar extends LitElement {
    workbookId: string;
    workbookName: string;
    workbookStatus: string;
    sections: EFPSection[];
    currentSectionIndex: number;
    sectionCompletion: Map<number, boolean>;
    sectionSkipped: Map<number, boolean>;
    tabGroupEl: HTMLElement & {
        show: (tabName: string) => void;
    };
    static styles: import("lit").CSSResult;
    protected updated(changedProps: PropertyValues): void;
    private handleSectionChange;
    private getSectionCompletion;
    private getSectionSkipped;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'navigation-sidebar': NavigationSidebar;
    }
}
