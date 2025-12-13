import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';

@customElement('navigation-buttons')
export class NavigationButtons extends LitElement {
  @property({ type: Boolean }) isPreviousDisabled = false;
  @property({ type: Boolean }) isContinueDisabled = false;
  @property({ type: String }) continueDisabledTooltip = '';
  @property({ type: Number }) sectionsLength = 0;

  static styles = css`
    .navigation-card {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      align-items: center;
      padding: 1rem;
      background: var(--sl-color-neutral-0);
      border: 1px solid var(--sl-color-neutral-200);
      border-radius: var(--sl-border-radius-medium);
      box-shadow: var(--sl-shadow-x-small);
    }

    .continue-button-wrapper {
      display: inline-block;
    }

    @media (max-width: 768px) {
      .navigation-card {
        flex-direction: column;
        gap: 0.5rem;
      }

      sl-button {
        width: 100%;
      }

      .continue-button-wrapper {
        width: 100%;
      }
    }
  `;

  private handlePrevious() {
    this.dispatchEvent(new CustomEvent('previous-clicked', {
      bubbles: true,
      composed: true
    }));
  }

  private handleSkip() {
    this.dispatchEvent(new CustomEvent('skip-clicked', {
      bubbles: true,
      composed: true,
      detail: { sectionIndex: this.sectionsLength - 1 }
    }));
  }

  private handleContinue() {
    this.dispatchEvent(new CustomEvent('continue-clicked', {
      bubbles: true,
      composed: true
    }));
  }

  private handleContinueWrapperClick(e: Event) {
    // Only handle clicks when button is actually disabled
    // When enabled, let the button's own click handler fire
    if (!this.isContinueDisabled) {
      return;
    }

    // Button is disabled, prevent default and show validation
    e.preventDefault();
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('continue-disabled-clicked', {
      bubbles: true,
      composed: true
    }));
  }

  render() {
    const continueButton = html`
      <sl-button
        variant="primary"
        size="large"
        ?disabled=${this.isContinueDisabled}
        @click=${this.handleContinue}
      >
        Continue
      </sl-button>
    `;

    return html`
      <div class="navigation-card">
        <sl-button
          variant="default"
          size="large"
          ?disabled=${this.isPreviousDisabled}
          @click=${this.handlePrevious}
        >
          <sl-icon name="chevron-left"></sl-icon>
          Previous
        </sl-button>

        <sl-button
          variant="text"
          @click=${this.handleSkip}
        >
          Skip to Next Required Step
        </sl-button>

        ${this.isContinueDisabled && this.continueDisabledTooltip
          ? html`
              <sl-tooltip
                content=${this.continueDisabledTooltip}
                placement="top"
                hoist
              >
                <div
                  class="continue-button-wrapper"
                  @click=${this.handleContinueWrapperClick}
                >
                  ${continueButton}
                </div>
              </sl-tooltip>
            `
          : continueButton}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'navigation-buttons': NavigationButtons;
  }
}
