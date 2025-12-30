import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
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
  `;

  render() {
    return html`
      <div class="card">
        <strong>${this.completionPercentage}% Complete</strong>
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

