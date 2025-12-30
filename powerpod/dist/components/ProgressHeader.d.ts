import { LitElement } from 'lit';
/**
 * ProgressHeader Component
 *
 * Displays workbook completion percentage and progress bar
 */
export declare class ProgressHeader extends LitElement {
    completionPercentage: number;
    static styles: import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'progress-header': ProgressHeader;
    }
}
