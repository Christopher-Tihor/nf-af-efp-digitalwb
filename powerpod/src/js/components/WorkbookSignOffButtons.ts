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

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Logger } from '../common/logger.js';
import { hasRole } from '../common/userRoles.js';
import { getCurrentWorkbookId, getWorkbookData } from '../common/workbookUtils.js';
import { patchWorkbookData } from '../common/fetch.js';
import { YES_VALUE, NO_VALUE, WORKBOOK_STATUS } from '../common/constants.js';

const logger = Logger('components/WorkbookSignOffButtons');

// Convert string values to integers for API
const YES_INT = parseInt(YES_VALUE, 10); // 100000000
const NO_INT = parseInt(NO_VALUE, 10);   // 100000001

// Debug mode flags
let debugModeEnabled = false;
let debugClearSignOffEnabled = false;
let debugRoleOverride: 'producer' | 'advisor' | 'both' | 'none' | null = null;

// Expose debug functions to window for console access
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

// Enable debug mode - allows sign-off in Draft status
window.enableSignOffDebugging = () => {
  debugModeEnabled = true;
  logger.info({
    fn: 'enableSignOffDebugging',
    message: '🐛 DEBUG MODE ENABLED: Draft status requirement will be ignored for sign-off',
  });
  console.log('✅ Sign-off debugging enabled. Draft status requirement is now ignored.');
  // Trigger re-render of all sign-off button instances
  document.querySelectorAll('workbook-sign-off-buttons').forEach((el: any) => {
    el.requestUpdate?.();
  });
};

// Disable debug mode - restores normal Draft status requirement
window.disableSignOffDebugging = () => {
  debugModeEnabled = false;
  logger.info({
    fn: 'disableSignOffDebugging',
    message: '🐛 DEBUG MODE DISABLED: Draft status requirement restored for sign-off',
  });
  console.log('✅ Sign-off debugging disabled. Draft status requirement is now enforced.');
  // Trigger re-render of all sign-off button instances
  document.querySelectorAll('workbook-sign-off-buttons').forEach((el: any) => {
    el.requestUpdate?.();
  });
};

// Enable clear sign-off debug mode - allows clearing sign-off even when both have signed
window.enableClearSignOffDebugging = () => {
  debugClearSignOffEnabled = true;
  logger.info({
    fn: 'enableClearSignOffDebugging',
    message: '🐛 DEBUG MODE ENABLED: Clear Sign-Off will be enabled even when both PA and Producer have signed',
  });
  console.log('✅ Clear Sign-Off debugging enabled. You can now clear sign-off even when both have signed.');
  // Trigger re-render of all sign-off button instances
  document.querySelectorAll('workbook-sign-off-buttons').forEach((el: any) => {
    el.requestUpdate?.();
  });
};

// Disable clear sign-off debug mode - restores normal restriction
window.disableClearSignOffDebugging = () => {
  debugClearSignOffEnabled = false;
  logger.info({
    fn: 'disableClearSignOffDebugging',
    message: '🐛 DEBUG MODE DISABLED: Clear Sign-Off restriction restored (disabled when both have signed)',
  });
  console.log('✅ Clear Sign-Off debugging disabled. Clear Sign-Off is now disabled when both have signed.');
  // Trigger re-render of all sign-off button instances
  document.querySelectorAll('workbook-sign-off-buttons').forEach((el: any) => {
    el.requestUpdate?.();
  });
};

// Set role override for testing
window.setSignOffRole = (role: 'producer' | 'advisor' | 'both' | 'none') => {
  debugRoleOverride = role;
  logger.info({
    fn: 'setSignOffRole',
    message: `🐛 DEBUG ROLE OVERRIDE: Set to '${role}'`,
    data: { role },
  });

  const roleMessages = {
    producer: 'Producer role only',
    advisor: 'Planning Advisor role only',
    both: 'Both Producer and Planning Advisor roles',
    none: 'No roles (buttons hidden)',
  };

  console.log(`✅ Sign-off role override set to: ${roleMessages[role]}`);

  // Trigger re-render of all sign-off button instances
  document.querySelectorAll('workbook-sign-off-buttons').forEach((el: any) => {
    el.requestUpdate?.();
  });
};

// Reset role override - restore actual user roles
window.resetSignOffRole = () => {
  debugRoleOverride = null;
  logger.info({
    fn: 'resetSignOffRole',
    message: '🐛 DEBUG ROLE OVERRIDE: Reset to actual user roles',
  });
  console.log('✅ Sign-off role override reset. Using actual user roles.');

  // Trigger re-render of all sign-off button instances
  document.querySelectorAll('workbook-sign-off-buttons').forEach((el: any) => {
    el.requestUpdate?.();
  });
};

// Get current debug status
window.getSignOffDebugStatus = () => {
  const status = {
    statusBypassEnabled: debugModeEnabled,
    clearSignOffEnabled: debugClearSignOffEnabled,
    roleOverride: debugRoleOverride || 'none (using actual roles)',
  };

  console.log('🐛 Sign-off Debug Status:');
  console.log(`  - Draft status bypass: ${status.statusBypassEnabled ? '✅ ENABLED' : '❌ DISABLED'}`);
  console.log(`  - Clear Sign-Off bypass: ${status.clearSignOffEnabled ? '✅ ENABLED' : '❌ DISABLED'}`);
  console.log(`  - Role override: ${status.roleOverride}`);
  console.log('\nAvailable debug commands:');
  console.log('  - enableSignOffDebugging()');
  console.log('  - disableSignOffDebugging()');
  console.log('  - enableClearSignOffDebugging()');
  console.log('  - disableClearSignOffDebugging()');
  console.log('  - setSignOffRole("producer" | "advisor" | "both" | "none")');
  console.log('  - resetSignOffRole()');
  console.log('  - getSignOffDebugStatus()');

  return status;
};

@customElement('workbook-sign-off-buttons')
export class WorkbookSignOffButtons extends LitElement {
  @state() private paSigned: boolean = false;
  @state() private producerSigned: boolean = false;
  @state() private isLoading: boolean = false;
  @state() private showPAButton: boolean = false;
  @state() private showProducerButton: boolean = false;
  @state() private showPAStatus: boolean = false;
  @state() private workbookStatus: number | null = null;

  static styles = css`
    /* BC Gov Design System Color Tokens */
    :host {
      --bcgov-blue: #003366;
      --bcgov-blue-70: #1a5a96;
      --bcgov-white: #ffffff;
      --bcgov-focus: #3399ff;
      --bcgov-disabled: #757575;
      --bcgov-secondary-hover: #edebe9;
    }

    .sign-off-container {
      margin-top: 2rem;
      padding: 1.5rem;
      background-color: var(--sl-color-neutral-50);
      border-radius: var(--sl-border-radius-medium);
      border: 1px solid var(--sl-color-neutral-200);
    }

    .sign-off-title {
      font-family: 'BC Sans', 'Noto Sans', Verdana, sans-serif;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--sl-color-neutral-900);
      margin-bottom: 1rem;
    }

    .sign-off-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      padding: 1rem;
      background-color: var(--sl-color-neutral-0);
      border-radius: var(--sl-border-radius-small);
      border: 1px solid var(--sl-color-neutral-200);
    }

    .sign-off-label {
      font-family: 'BC Sans', 'Noto Sans', Verdana, sans-serif;
      font-weight: 500;
      min-width: 150px;
    }

    .sign-off-status {
      flex: 1;
      font-family: 'BC Sans', 'Noto Sans', Verdana, sans-serif;
      color: var(--sl-color-neutral-600);
    }

    .status-signed {
      color: var(--sl-color-success-600);
      font-weight: 500;
    }

    .status-not-signed {
      color: var(--sl-color-warning-600);
      font-weight: 500;
    }

    /* BC Gov Primary Button */
    sl-button[variant="primary"]::part(base) {
      background-color: var(--bcgov-blue-70);
      border-color: var(--bcgov-blue-70);
      color: var(--bcgov-white);
    }

    sl-button[variant="primary"]:hover::part(base) {
      background-color: var(--bcgov-blue);
      border-color: var(--bcgov-blue);
    }

    sl-button[variant="primary"]:focus-visible::part(base) {
      outline: 3px solid var(--bcgov-focus);
      outline-offset: 2px;
    }

    sl-button[variant="primary"][disabled]::part(base) {
      background-color: var(--bcgov-disabled);
      border-color: var(--bcgov-disabled);
      opacity: 0.65;
    }

    /* BC Gov Secondary Button */
    sl-button[variant="default"]::part(base) {
      background-color: var(--bcgov-white);
      border-color: var(--bcgov-blue-70);
      color: var(--bcgov-blue-70);
    }

    sl-button[variant="default"]:hover::part(base) {
      background-color: var(--bcgov-secondary-hover);
    }

    sl-button[variant="default"]:focus-visible::part(base) {
      outline: 3px solid var(--bcgov-focus);
      outline-offset: 2px;
    }

    sl-button[variant="default"][disabled]::part(base) {
      opacity: 0.65;
    }

    @media (max-width: 768px) {
      .sign-off-row {
        flex-direction: column;
        align-items: flex-start;
      }

      sl-button {
        width: 100%;
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadSignOffData();
    this.checkUserRoles();

    // Listen for workbook data refresh events
    this.addEventListener('workbook-data-refreshed', this.handleWorkbookDataRefreshed as EventListener);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // Remove event listener
    this.removeEventListener('workbook-data-refreshed', this.handleWorkbookDataRefreshed as EventListener);
  }

  // Handle workbook data refreshed event
  private handleWorkbookDataRefreshed = (event: Event) => {
    const customEvent = event as CustomEvent;
    logger.info({
      fn: 'handleWorkbookDataRefreshed',
      message: 'Workbook data refreshed, reloading sign-off data',
      data: customEvent.detail,
    });

    // Reload sign-off data to pick up updated workbook status
    this.loadSignOffData();

    // Trigger re-render to update button states
    this.requestUpdate();
  };

  private checkUserRoles() {
    // Check if debug role override is active
    if (debugRoleOverride !== null) {
      switch (debugRoleOverride) {
        case 'producer':
          // Producer sees PA status indicator (no button), no Producer sign-off
          this.showPAButton = false;
          this.showProducerButton = false;
          this.showPAStatus = true;
          break;
        case 'advisor':
          // PA sees their own status with button
          this.showPAButton = true;
          this.showProducerButton = false;
          this.showPAStatus = true;
          break;
        case 'both':
          // Show PA status with button (Producer sign-off removed)
          this.showPAButton = true;
          this.showProducerButton = false;
          this.showPAStatus = true;
          break;
        case 'none':
          this.showPAButton = false;
          this.showProducerButton = false;
          this.showPAStatus = false;
          break;
      }

      logger.info({
        fn: 'checkUserRoles',
        message: '🐛 DEBUG ROLE OVERRIDE: Using debug role settings',
        data: {
          debugRoleOverride,
          showPAButton: this.showPAButton,
          showProducerButton: this.showProducerButton,
          showPAStatus: this.showPAStatus,
        },
      });
    } else {
      // Use actual user roles
      // PA sees their sign-off button; Producer sees PA status only (no buttons)
      this.showPAButton = hasRole('EFP Planning Advisor');
      this.showProducerButton = false; // Producer sign-off UI removed
      this.showPAStatus = hasRole('EFP Planning Advisor') || hasRole('EFP Producer');

      logger.info({
        fn: 'checkUserRoles',
        message: 'Checked user roles for sign-off buttons',
        data: {
          showPAButton: this.showPAButton,
          showProducerButton: this.showProducerButton,
          showPAStatus: this.showPAStatus,
        },
      });
    }
  }

  private loadSignOffData() {
    const workbookData = getWorkbookData();

    if (workbookData) {
      // Convert integer values to boolean
      // YES_INT (100000000) = true (signed), NO_INT (100000001) or null/undefined = false (not signed)
      this.paSigned = workbookData.quartech_pasigned === YES_INT;
      this.producerSigned = workbookData.quartech_producersigned === YES_INT;
      this.workbookStatus = workbookData.quartech_workbookstatus ?? null;

      logger.info({
        fn: 'loadSignOffData',
        message: 'Loaded sign-off status from workbook data',
        data: {
          paSigned: this.paSigned,
          producerSigned: this.producerSigned,
          workbookStatus: this.workbookStatus,
          rawPAValue: workbookData.quartech_pasigned,
          rawProducerValue: workbookData.quartech_producersigned,
        },
      });
    }
  }

  /**
   * Check if PA sign-off button should be enabled
   * Enable sign-off only when:
   * - Workbook in Assigned status OR Producer Signed status (meaning Producer has signed)
   *
   * Disable sign-off for:
   * - Workbook in Draft status (unless debug mode is enabled)
   * - PA Signed (for the PA - they already signed)
   * - Workbook in Completed status
   * - Workbook in Expired status
   */
  private canPASignOff(): boolean {
    // If already signed, can only cancel (not sign)
    if (this.paSigned) {
      return false;
    }

    // In debug mode, allow sign-off in Draft status
    if (debugModeEnabled) {
      logger.info({
        fn: 'canPASignOff',
        message: '🐛 DEBUG MODE: Allowing PA sign-off regardless of workbook status',
        data: { workbookStatus: this.workbookStatus },
      });
      return true;
    }

    // Can sign if workbook is in Assigned status or Producer Signed status
    // This allows PA to sign when workbook is assigned or after Producer has signed
    return this.workbookStatus === WORKBOOK_STATUS.ASSIGNED ||
           this.workbookStatus === WORKBOOK_STATUS.PRODUCER_SIGNED;
  }

  /**
   * Check if PA can cancel their sign-off
   * Enable cancel sign-off only for:
   * - PA Signed (for the PA)
   * - UNLESS both PA and Producer have signed (then disable Clear Sign-Off)
   *   (can be bypassed with debug mode)
   */
  private canPACancelSignOff(): boolean {
    // In debug mode, allow clearing sign-off even when both have signed
    if (debugClearSignOffEnabled && this.paSigned) {
      logger.info({
        fn: 'canPACancelSignOff',
        message: '🐛 DEBUG MODE: Allowing PA to clear sign-off even when both have signed',
        data: { paSigned: this.paSigned, producerSigned: this.producerSigned },
      });
      return true;
    }

    // If both PA and Producer have signed, disable Clear Sign-Off
    if (this.paSigned && this.producerSigned) {
      return false;
    }
    return this.paSigned;
  }

  /**
   * Check if Producer sign-off button should be enabled
   * Enable sign-off only when:
   * - Workbook in Assigned status OR PA Signed status (meaning PA has signed)
   *
   * Disable sign-off for:
   * - Workbook in Draft status (unless debug mode is enabled)
   * - Producer Signed (for the Producer - they already signed)
   * - Workbook in Completed status
   * - Workbook in Expired status
   */
  private canProducerSignOff(): boolean {
    // If already signed, can only cancel (not sign)
    if (this.producerSigned) {
      return false;
    }

    // In debug mode, allow sign-off in Draft status
    if (debugModeEnabled) {
      logger.info({
        fn: 'canProducerSignOff',
        message: '🐛 DEBUG MODE: Allowing Producer sign-off regardless of workbook status',
        data: { workbookStatus: this.workbookStatus },
      });
      return true;
    }

    // Can sign if workbook is in Assigned status or PA Signed status
    // This allows Producer to sign when workbook is assigned or after PA has signed
    return this.workbookStatus === WORKBOOK_STATUS.ASSIGNED ||
           this.workbookStatus === WORKBOOK_STATUS.PA_SIGNED;
  }

  /**
   * Check if Producer can cancel their sign-off
   * Enable cancel sign-off only for:
   * - Producer Signed (for the Producer)
   * - UNLESS both PA and Producer have signed (then disable Clear Sign-Off)
   *   (can be bypassed with debug mode)
   */
  private canProducerCancelSignOff(): boolean {
    // In debug mode, allow clearing sign-off even when both have signed
    if (debugClearSignOffEnabled && this.producerSigned) {
      logger.info({
        fn: 'canProducerCancelSignOff',
        message: '🐛 DEBUG MODE: Allowing Producer to clear sign-off even when both have signed',
        data: { paSigned: this.paSigned, producerSigned: this.producerSigned },
      });
      return true;
    }

    // If both PA and Producer have signed, disable Clear Sign-Off
    if (this.paSigned && this.producerSigned) {
      return false;
    }
    return this.producerSigned;
  }

  /**
   * Get tooltip message for PA button when disabled
   */
  private getPADisabledTooltip(): string {
    if (this.paSigned) {
      // If both have signed, show different message
      if (this.producerSigned) {
        // In debug mode, show debug message
        if (debugClearSignOffEnabled) {
          return '🐛 DEBUG MODE: Clear Sign-Off restriction is bypassed';
        }
        return 'Cannot clear sign-off when both Planning Advisor and Producer have signed.';
      }
      return 'You have already signed. Click to cancel your sign-off.';
    }

    // In debug mode, show debug message
    if (debugModeEnabled) {
      return '🐛 DEBUG MODE: Draft status requirement is bypassed';
    }

    if (this.workbookStatus === WORKBOOK_STATUS.DRAFT) {
      return 'Sign-off is not available for workbooks in Draft status.';
    }

    if (this.workbookStatus === WORKBOOK_STATUS.COMPLETED) {
      return 'Sign-off is not available for workbooks in Completed status.';
    }

    if (this.workbookStatus === WORKBOOK_STATUS.EXPIRED) {
      return 'Sign-off is not available for workbooks in Expired status.';
    }

    if (this.workbookStatus !== WORKBOOK_STATUS.ASSIGNED &&
        this.workbookStatus !== WORKBOOK_STATUS.PRODUCER_SIGNED) {
      return 'You can only sign off when the workbook is in Assigned status, or after the Producer has signed.';
    }

    return 'Sign-off is currently disabled.';
  }

  /**
   * Get tooltip message for Producer button when disabled
   */
  private getProducerDisabledTooltip(): string {
    if (this.producerSigned) {
      // If both have signed, show different message
      if (this.paSigned) {
        // In debug mode, show debug message
        if (debugClearSignOffEnabled) {
          return '🐛 DEBUG MODE: Clear Sign-Off restriction is bypassed';
        }
        return 'Cannot clear sign-off when both Planning Advisor and Producer have signed.';
      }
      return 'You have already signed. Click to cancel your sign-off.';
    }

    // In debug mode, show debug message
    if (debugModeEnabled) {
      return '🐛 DEBUG MODE: Draft status requirement is bypassed';
    }

    if (this.workbookStatus === WORKBOOK_STATUS.DRAFT) {
      return 'Sign-off is not available for workbooks in Draft status.';
    }

    if (this.workbookStatus === WORKBOOK_STATUS.COMPLETED) {
      return 'Sign-off is not available for workbooks in Completed status.';
    }

    if (this.workbookStatus === WORKBOOK_STATUS.EXPIRED) {
      return 'Sign-off is not available for workbooks in Expired status.';
    }

    if (this.workbookStatus !== WORKBOOK_STATUS.ASSIGNED &&
        this.workbookStatus !== WORKBOOK_STATUS.PA_SIGNED) {
      return 'You can only sign off when the workbook is in Assigned status, or after the PA has signed.';
    }

    return 'Sign-off is currently disabled.';
  }

  private async handlePASignOff() {
    await this.handleSignOff('PA', 'quartech_pasigned');
  }

  private async handleProducerSignOff() {
    await this.handleSignOff('Producer', 'quartech_producersigned');
  }

  private async handleSignOff(roleType: string, fieldName: string) {
    const workbookId = getCurrentWorkbookId();

    if (!workbookId) {
      logger.error({
        fn: 'handleSignOff',
        message: 'No workbook ID found',
      });
      alert('Error: Unable to find workbook ID');
      return;
    }

    this.isLoading = true;

    try {
      // Toggle the sign-off: if currently signed (Yes), set to No; if not signed (No), set to Yes
      const currentlySigned = roleType === 'PA' ? this.paSigned : this.producerSigned;
      const newValue = currentlySigned ? NO_INT : YES_INT;

      logger.info({
        fn: 'handleSignOff',
        message: `${roleType} sign-off button clicked`,
        data: {
          workbookId,
          fieldName,
          currentlySigned,
          newValue,
          newValueMeaning: currentlySigned ? 'No (100000001)' : 'Yes (100000000)',
          action: currentlySigned ? 'clear' : 'sign',
        },
      });

      const fieldData = {
        [fieldName]: newValue,
      };

      await patchWorkbookData({ id: workbookId, fieldData });

      // Update local state
      if (roleType === 'PA') {
        this.paSigned = !currentlySigned;
      } else {
        this.producerSigned = !currentlySigned;
      }

      // CRITICAL: Update the cached workbook data to prevent stale state
      // This ensures that when navigating away and back, the correct state is loaded
      const workbookData = getWorkbookData();
      if (workbookData) {
        (workbookData as any)[fieldName] = newValue;
        logger.info({
          fn: 'handleSignOff',
          message: `Updated cached workbook data for ${fieldName}`,
          data: { fieldName, newValue },
        });
      }

      logger.info({
        fn: 'handleSignOff',
        message: `Successfully updated ${roleType} sign-off`,
        data: { newSigned: !currentlySigned },
      });

      // Dispatch custom event to notify other components that sign-off status changed
      this.dispatchEvent(new CustomEvent('sign-off-changed', {
        bubbles: true,
        composed: true,
        detail: {
          roleType,
          fieldName,
          signed: !currentlySigned,
        },
      }));

    } catch (error) {
      logger.error({
        fn: 'handleSignOff',
        message: `Failed to update ${roleType} sign-off`,
        data: { error },
      });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error updating sign-off: ${errorMessage}`);
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    // Show component if PA status row should be visible (for both PA and Producer roles)
    if (!this.showPAStatus) {
      return html``;
    }

    // Determine button states for PA (only relevant when showPAButton is true)
    const canPASign = this.canPASignOff();
    const canPACancel = this.canPACancelSignOff();
    const isPAButtonEnabled = canPASign || canPACancel;
    const paTooltip = !isPAButtonEnabled ? this.getPADisabledTooltip() : '';

    return html`
      <div class="sign-off-container">
        <div class="sign-off-title">Sign-Off</div>

        <div class="sign-off-row">
          <div class="sign-off-label">Planning Advisor:</div>
          <div class="sign-off-status">
            ${this.paSigned
              ? html`<span class="status-signed">✓ Signed</span>`
              : html`<span class="status-not-signed">⚠ Not signed</span>`
            }
          </div>
          ${this.showPAButton ? html`
            ${!isPAButtonEnabled ? html`
              <sl-tooltip content=${paTooltip}>
                <sl-button
                  variant=${this.paSigned ? 'default' : 'primary'}
                  size="medium"
                  ?loading=${this.isLoading}
                  ?disabled=${!isPAButtonEnabled}
                  @click=${this.handlePASignOff}
                >
                  ${this.paSigned ? 'Clear Sign-Off' : 'Sign-Off'}
                </sl-button>
              </sl-tooltip>
            ` : html`
              <sl-button
                variant=${this.paSigned ? 'default' : 'primary'}
                size="medium"
                ?loading=${this.isLoading}
                ?disabled=${!isPAButtonEnabled}
                @click=${this.handlePASignOff}
              >
                ${this.paSigned ? 'Clear Sign-Off' : 'Sign-Off'}
              </sl-button>
            `}
          ` : ''}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'workbook-sign-off-buttons': WorkbookSignOffButtons;
  }
}

