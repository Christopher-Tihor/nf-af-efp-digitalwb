import '@shoelace-style/shoelace/dist/components/details/details.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';
import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js';
import '@shoelace-style/shoelace/dist/components/tab/tab.js';
import '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import { LitElement } from 'lit';
import './NavigationButtons';
import './RatingQuestion';
import { EFPActiveContent } from './efp';
declare class EFPEntryFormModular extends LitElement {
    currentSectionIndex: number;
    currentStepIndex: number;
    nestedChapterStructure: any[];
    private isNavigating;
    activeContent: EFPActiveContent;
    tabGroupEl: HTMLElement & {
        show: (tabName: string) => void;
    };
    static styles: import("lit").CSSResult;
    constructor();
    connectedCallback(): void;
    firstUpdated(): void;
    updateNestedChapterStructure(nestedStructure: any[]): void;
    private get completionPercent();
    private get sections();
    private get flatSteps();
    private renderQuestion;
    private renderQuestionInput;
    private renderSubchapter;
    private renderSubSubchapter;
    private renderChapter;
    private renderMainContent;
    private renderItems;
    private goToNext;
    private goToPrevious;
    private navigateToStep;
    private handleNavigationPrevious;
    private handleNavigationSkip;
    private handleNavigationContinue;
    private handleSectionChange;
    private handleRatingChanged;
    private handleItemClick;
    private updateNavigationState;
    private isSectionComplete;
    willUpdate(changedProps: Map<string, unknown>): void;
    updated(changedProps: Map<string, unknown>): void;
    render(): import("lit-html").TemplateResult<1>;
}
export { EFPEntryFormModular };
declare global {
    interface HTMLElementTagNameMap {
        'efp-entry-form-modular': EFPEntryFormModular;
    }
}
