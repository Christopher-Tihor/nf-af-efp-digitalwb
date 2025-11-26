import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Logger } from '../common/logger.js';
import { hasRole } from '../common/userRoles.js';
import { getCurrentWorkbookId, getWorkbookData } from '../common/workbookUtils.js';
import { patchWorkbookData } from '../common/fetch.js';
import { YES_VALUE, NO_VALUE } from '../common/constants.js';

const logger = Logger('components/WorkbookSignOffButtons');

// Convert string values to integers for API
const YES_INT = parseInt(YES_VALUE, 10); // 100000000
const NO_INT = parseInt(NO_VALUE, 10);   // 100000001

@customElement('workbook-sign-off-buttons')
export class WorkbookSignOffButtons extends LitElement {
  @state() private paSigned: boolean = false;
  @state() private producerSigned: boolean = false;
  @state() private isLoading: boolean = false;
  @state() private showPAButton: boolean = false;
  @state() private showProducerButton: boolean = false;

  static styles = css`
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
  }

  private checkUserRoles() {
    this.showPAButton = hasRole('EFP Planning Advisor');
    this.showProducerButton = hasRole('EFP Producer');

    logger.info({
      fn: 'checkUserRoles',
      message: 'Checked user roles for sign-off buttons',
      data: {
        showPAButton: this.showPAButton,
        showProducerButton: this.showProducerButton,
      },
    });
  }

  private loadSignOffData() {
    const workbookData = getWorkbookData();

    if (workbookData) {
      // Convert integer values to boolean
      // YES_INT (100000000) = true (signed), NO_INT (100000001) or null/undefined = false (not signed)
      this.paSigned = workbookData.quartech_pasigned === YES_INT;
      this.producerSigned = workbookData.quartech_producersigned === YES_INT;

      logger.info({
        fn: 'loadSignOffData',
        message: 'Loaded sign-off status from workbook data',
        data: {
          paSigned: this.paSigned,
          producerSigned: this.producerSigned,
          rawPAValue: workbookData.quartech_pasigned,
          rawProducerValue: workbookData.quartech_producersigned,
        },
      });
    }
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

      logger.info({
        fn: 'handleSignOff',
        message: `Successfully updated ${roleType} sign-off`,
        data: { newSigned: !currentlySigned },
      });

    } catch (error) {
      logger.error({
        fn: 'handleSignOff',
        message: `Failed to update ${roleType} sign-off`,
        data: { error },
      });
      alert(`Error updating sign-off: ${error.message || 'Unknown error'}`);
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    if (!this.showPAButton && !this.showProducerButton) {
      return html``;
    }

    return html`
      <div class="sign-off-container">
        <div class="sign-off-title">Sign-Off</div>

        ${this.showPAButton ? html`
          <div class="sign-off-row">
            <div class="sign-off-label">Planning Advisor:</div>
            <div class="sign-off-status">
              ${this.paSigned
                ? html`<span class="status-signed">✓ Signed</span>`
                : html`<span class="status-not-signed">⚠ Not signed</span>`
              }
            </div>
            <sl-button
              variant=${this.paSigned ? 'default' : 'primary'}
              size="medium"
              ?loading=${this.isLoading}
              @click=${this.handlePASignOff}
            >
              ${this.paSigned ? 'Clear Sign-Off' : 'Sign-Off (PA)'}
            </sl-button>
          </div>
        ` : ''}

        ${this.showProducerButton ? html`
          <div class="sign-off-row">
            <div class="sign-off-label">Producer:</div>
            <div class="sign-off-status">
              ${this.producerSigned
                ? html`<span class="status-signed">✓ Signed</span>`
                : html`<span class="status-not-signed">⚠ Not signed</span>`
              }
            </div>
            <sl-button
              variant=${this.producerSigned ? 'default' : 'primary'}
              size="medium"
              ?loading=${this.isLoading}
              @click=${this.handleProducerSignOff}
            >
              ${this.producerSigned ? 'Clear Sign-Off' : 'Sign-Off (Producer)'}
            </sl-button>
          </div>
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'workbook-sign-off-buttons': WorkbookSignOffButtons;
  }
}

