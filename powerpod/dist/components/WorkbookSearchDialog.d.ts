import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import { LitElement } from 'lit';
import { EFPStep, EFPSection } from './efp/types.js';
export interface SearchResult {
    type: 'chapter' | 'subchapter' | 'question';
    id: string;
    title: string;
    parentTitle?: string;
    chapterId?: string;
    questionText?: string;
    stepIndex: number;
}
export declare class WorkbookSearchDialog extends LitElement {
    flatSteps: EFPStep[];
    sections: EFPSection[];
    private searchQuery;
    private searchResults;
    private selectedIndex;
    private isOpen;
    dialogEl: HTMLElement & {
        show: () => void;
        hide: () => void;
    };
    inputEl: HTMLElement & {
        focus: () => void;
    };
    static styles: import("lit").CSSResult;
    show(): void;
    hide(): void;
    private handleSearchInput;
    private performSearch;
    private findStepIndexByLabel;
    private stripHtml;
    private handleKeyDown;
    private selectResult;
    private getTypeVariant;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'workbook-search-dialog': WorkbookSearchDialog;
    }
}
