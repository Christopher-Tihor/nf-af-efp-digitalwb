import { LitElement } from 'lit';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
/**
 * ProgressHeader Component
 *
 * Displays workbook completion percentage and progress bar
 */
export declare class ProgressHeader extends LitElement {
    completionPercentage: number;
    fullWidthLayout: boolean;
    static styles: import("lit").CSSResult;
    private handleLayoutToggle;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'progress-header': ProgressHeader;
    }
}
