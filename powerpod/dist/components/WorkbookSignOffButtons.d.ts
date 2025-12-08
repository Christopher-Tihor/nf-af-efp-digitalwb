import { LitElement } from 'lit';
export declare class WorkbookSignOffButtons extends LitElement {
    private paSigned;
    private producerSigned;
    private isLoading;
    private showPAButton;
    private showProducerButton;
    private workbookStatus;
    static styles: import("lit").CSSResult;
    connectedCallback(): void;
    private checkUserRoles;
    private loadSignOffData;
    /**
     * Check if PA sign-off button should be enabled
     * Enable sign-off only when:
     * - Workbook in Assigned status OR Producer Signed status (meaning Producer has signed)
     *
     * Disable sign-off for:
     * - Workbook in Draft status
     * - PA Signed (for the PA - they already signed)
     * - Workbook in Completed status
     * - Workbook in Validated status
     * - Workbook in Expired status
     */
    private canPASignOff;
    /**
     * Check if PA can cancel their sign-off
     * Enable cancel sign-off only for:
     * - PA Signed (for the PA)
     */
    private canPACancelSignOff;
    /**
     * Check if Producer sign-off button should be enabled
     * Enable sign-off only when:
     * - Workbook in Assigned status OR PA Signed status (meaning PA has signed)
     *
     * Disable sign-off for:
     * - Workbook in Draft status
     * - Producer Signed (for the Producer - they already signed)
     * - Workbook in Completed status
     * - Workbook in Validated status
     * - Workbook in Expired status
     */
    private canProducerSignOff;
    /**
     * Check if Producer can cancel their sign-off
     * Enable cancel sign-off only for:
     * - Producer Signed (for the Producer)
     */
    private canProducerCancelSignOff;
    /**
     * Get tooltip message for PA button when disabled
     */
    private getPADisabledTooltip;
    /**
     * Get tooltip message for Producer button when disabled
     */
    private getProducerDisabledTooltip;
    private handlePASignOff;
    private handleProducerSignOff;
    private handleSignOff;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'workbook-sign-off-buttons': WorkbookSignOffButtons;
    }
}
