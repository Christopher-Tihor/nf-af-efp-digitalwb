import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import { Logger } from '../common/logger.js';

const logger = Logger('components/ProgressHeader');

/**
 * ProgressHeader Component
 *
 * Displays workbook completion percentage and progress bar
 */
@customElement('progress-header')
export class ProgressHeader extends LitElement {
  @property({ type: Number }) completionPercentage = 0;
  @property({ type: Boolean }) fullWidthLayout = false;

  static styles = css`
    :host {
      display: block;
    }

    .card {
      background: var(--sl-color-neutral-0);
      border: 1px solid var(--sl-color-neutral-200);
      border-radius: var(--sl-border-radius-medium);
      padding: 1rem;
      margin-top: 0.5rem;
      margin-bottom: 1rem;
      box-shadow: var(--sl-shadow-x-small);
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .card strong {
      font-weight: 600;
      color: var(--sl-color-neutral-700);
      font-size: 1rem;
    }

    .progress-bar-container {
      width: 100%;
      height: 0.75rem;
      background-color: #e5e7eb;
      border-radius: 0.375rem;
      margin-top: 0.5rem;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background-color: #3b82f6;
      border-radius: 0.375rem;
      transition: width 0.3s ease;
    }

    .layout-toggle {
      display: flex;
      align-items: center;
    }

    .layout-toggle sl-icon-button::part(base) {
      font-size: 1.25rem;
      color: var(--sl-color-neutral-600);
      transition: color 0.2s ease;
    }

    .layout-toggle sl-icon-button::part(base):hover {
      color: var(--sl-color-primary-600);
    }
  `;

  private handleLayoutToggle() {
    this.dispatchEvent(
      new CustomEvent('layout-toggle', {
        bubbles: true,
        composed: true,
        detail: { fullWidthLayout: !this.fullWidthLayout },
      })
    );
  }

  render() {
    const tooltipText = this.fullWidthLayout
      ? 'Switch to narrow layout'
      : 'Switch to full-width layout';

    const iconName = this.fullWidthLayout
      ? 'arrows-angle-contract'
      : 'arrows-angle-expand';

    return html`
      <div class="card">
        <div class="header-row">
          <strong>${this.completionPercentage}% Complete</strong>
          <div class="layout-toggle">
            <sl-tooltip content="${tooltipText}">
              <sl-icon-button
                name="${iconName}"
                label="${tooltipText}"
                @click=${this.handleLayoutToggle}
              ></sl-icon-button>
            </sl-tooltip>
          </div>
        </div>
        <div class="progress-bar-container">
          <div
            class="progress-bar-fill"
            style="width: ${this.completionPercentage}%;"
          ></div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'progress-header': ProgressHeader;
  }
}

