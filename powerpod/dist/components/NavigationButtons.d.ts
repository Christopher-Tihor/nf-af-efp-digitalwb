import { LitElement } from 'lit';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
export declare class NavigationButtons extends LitElement {
    isPreviousDisabled: boolean;
    isContinueDisabled: boolean;
    continueDisabledTooltip: string;
    sectionsLength: number;
    static styles: import("lit").CSSResult;
    private handlePrevious;
    private handleSkip;
    private handleContinue;
    private handleContinueWrapperClick;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'navigation-buttons': NavigationButtons;
    }
}
