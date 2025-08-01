import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('navigation-buttons')
export class NavigationButtons extends LitElement {
  @property({ type: Boolean }) isPreviousDisabled = false;
  @property({ type: Boolean }) isContinueDisabled = false;
  @property({ type: Number }) sectionsLength = 0;

  static styles = css`
    .navigation-card {
      display: flex;
      gap: 1rem;
      align-items: center;
      padding: 1rem;
      background: var(--sl-color-neutral-0);
      border: 1px solid var(--sl-color-neutral-200);
      border-radius: var(--sl-border-radius-medium);
      box-shadow: var(--sl-shadow-x-small);
    }

    @media (max-width: 768px) {
      .navigation-card {
        flex-direction: column;
        gap: 0.5rem;
      }
      
      sl-button {
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

  render() {
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

        <sl-button
          variant="primary"
          size="large"
          ?disabled=${this.isContinueDisabled}
          @click=${this.handleContinue}
        >
          Continue
        </sl-button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'navigation-buttons': NavigationButtons;
  }
}
