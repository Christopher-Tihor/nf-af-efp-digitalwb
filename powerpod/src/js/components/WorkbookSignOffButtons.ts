import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Logger } from '../common/logger.js';
import { hasRole } from '../common/userRoles.js';
import { getCurrentWorkbookId, getWorkbookData } from '../common/workbookUtils.js';
import { patchWorkbookData } from '../common/fetch.js';

const logger = Logger('components/WorkbookSignOffButtons');

@customElement('workbook-sign-off-buttons')
export class WorkbookSignOffButtons extends LitElement {
  @state() private paSignOffDate: string | null = null;
  @state() private producerSignOffDate: string | null = null;
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
      this.paSignOffDate = workbookData.quartech_dateofpasignoff || null;
      this.producerSignOffDate = workbookData.quartech_dateofproducersignoff || null;

      logger.info({
        fn: 'loadSignOffData',
        message: 'Loaded sign-off dates from workbook data',
        data: {
          paSignOffDate: this.paSignOffDate,
          producerSignOffDate: this.producerSignOffDate,
        },
      });
    }
  }

  private async handlePASignOff() {
    await this.handleSignOff('PA', 'quartech_dateofpasignoff');
  }

  private async handleProducerSignOff() {
    await this.handleSignOff('Producer', 'quartech_dateofproducersignoff');
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
      const currentDate = roleType === 'PA' ? this.paSignOffDate : this.producerSignOffDate;
      const newValue = currentDate ? null : new Date().toISOString();

      logger.info({
        fn: 'handleSignOff',
        message: `${roleType} sign-off button clicked`,
        data: {
          workbookId,
          fieldName,
          currentDate,
          newValue,
          action: currentDate ? 'clear' : 'sign',
        },
      });

      const fieldData = {
        [fieldName]: newValue,
      };

      await patchWorkbookData({ id: workbookId, fieldData });

      // Update local state
      if (roleType === 'PA') {
        this.paSignOffDate = newValue;
      } else {
        this.producerSignOffDate = newValue;
      }

      logger.info({
        fn: 'handleSignOff',
        message: `Successfully updated ${roleType} sign-off`,
        data: { newValue },
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

  private formatDate(dateString: string | null): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      logger.warn({
        fn: 'formatDate',
        message: 'Failed to format date',
        data: { dateString, error },
      });
      return dateString;
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
              ${this.paSignOffDate
                ? html`<span class="status-signed">✓ Signed on ${this.formatDate(this.paSignOffDate)}</span>`
                : html`<span class="status-not-signed">Not signed</span>`
              }
            </div>
            <sl-button
              variant=${this.paSignOffDate ? 'default' : 'primary'}
              size="medium"
              ?loading=${this.isLoading}
              @click=${this.handlePASignOff}
            >
              ${this.paSignOffDate ? 'Clear Sign-Off' : 'Sign-Off (PA)'}
            </sl-button>
          </div>
        ` : ''}

        ${this.showProducerButton ? html`
          <div class="sign-off-row">
            <div class="sign-off-label">Producer:</div>
            <div class="sign-off-status">
              ${this.producerSignOffDate
                ? html`<span class="status-signed">✓ Signed on ${this.formatDate(this.producerSignOffDate)}</span>`
                : html`<span class="status-not-signed">Not signed</span>`
              }
            </div>
            <sl-button
              variant=${this.producerSignOffDate ? 'default' : 'primary'}
              size="medium"
              ?loading=${this.isLoading}
              @click=${this.handleProducerSignOff}
            >
              ${this.producerSignOffDate ? 'Clear Sign-Off' : 'Sign-Off (Producer)'}
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

