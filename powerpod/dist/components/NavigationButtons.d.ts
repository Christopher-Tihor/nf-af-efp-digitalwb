import { LitElement } from 'lit';
export declare class NavigationButtons extends LitElement {
    isPreviousDisabled: boolean;
    isContinueDisabled: boolean;
    sectionsLength: number;
    static styles: import("lit").CSSResult;
    private handlePrevious;
    private handleSkip;
    private handleContinue;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'navigation-buttons': NavigationButtons;
    }
}
