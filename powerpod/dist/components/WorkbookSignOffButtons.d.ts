/**
 * WorkbookSignOffButtons Component
 *
 * Provides sign-off functionality for PA (Planning Advisor) and Producer roles.
 *
 * DEBUG MODE:
 * For testing purposes, you can enable debug mode to bypass the Draft status requirement
 * and override user roles for testing sign-off functionality.
 *
 * In the browser console, run:
 *   - enableSignOffDebugging()      // Allows sign-off in Draft status
 *   - disableSignOffDebugging()     // Restores normal Draft status requirement
 *   - enableClearSignOffDebugging() // Allows clearing sign-off even when both have signed
 *   - disableClearSignOffDebugging()// Restores normal clear sign-off restriction
 *   - setSignOffRole('producer')    // Show only Producer sign-off button
 *   - setSignOffRole('advisor')     // Show only Planning Advisor sign-off button
 *   - setSignOffRole('both')        // Show both sign-off buttons
 *   - setSignOffRole('none')        // Hide all sign-off buttons
 *   - resetSignOffRole()            // Restore actual user roles
 *   - getSignOffDebugStatus()       // Display current debug settings
 */
import { LitElement } from 'lit';
declare global {
    interface Window {
        enableSignOffDebugging: () => void;
        disableSignOffDebugging: () => void;
        enableClearSignOffDebugging: () => void;
        disableClearSignOffDebugging: () => void;
        setSignOffRole: (role: 'producer' | 'advisor' | 'both' | 'none') => void;
        resetSignOffRole: () => void;
        getSignOffDebugStatus: () => void;
    }
}
export declare class WorkbookSignOffButtons extends LitElement {
    private paSigned;
    private producerSigned;
    private isLoading;
    private showPAButton;
    private showProducerButton;
    private workbookStatus;
    static styles: import("lit").CSSResult;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private handleWorkbookDataRefreshed;
    private checkUserRoles;
    private loadSignOffData;
    /**
     * Check if PA sign-off button should be enabled
     * Enable sign-off only when:
     * - Workbook in Assigned status OR Producer Signed status (meaning Producer has signed)
     *
     * Disable sign-off for:
     * - Workbook in Draft status (unless debug mode is enabled)
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
     * - UNLESS both PA and Producer have signed (then disable Clear Sign-Off)
     *   (can be bypassed with debug mode)
     */
    private canPACancelSignOff;
    /**
     * Check if Producer sign-off button should be enabled
     * Enable sign-off only when:
     * - Workbook in Assigned status OR PA Signed status (meaning PA has signed)
     *
     * Disable sign-off for:
     * - Workbook in Draft status (unless debug mode is enabled)
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
     * - UNLESS both PA and Producer have signed (then disable Clear Sign-Off)
     *   (can be bypassed with debug mode)
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
