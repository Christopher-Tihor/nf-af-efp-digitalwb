import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import { Logger } from '../common/logger.js';
import type { EFPSection } from './efp/types.js';

const logger = Logger('components/NavigationSidebar');

/**
 * NavigationSidebar Component
 *
 * Displays workbook information and section navigation with completion status
 * Chapters are shown directly without tabs.
 * "Review & Submit" is displayed as a dedicated section below "My Action Plan".
 */
@customElement('navigation-sidebar')
export class NavigationSidebar extends LitElement {
  @property({ type: String }) workbookId = 'N/A';
  @property({ type: String }) workbookName = 'N/A';
  @property({ type: String }) workbookStatus = 'N/A';
  @property({ type: Array }) sections: EFPSection[] = [];
  @property({ type: Number }) currentSectionIndex = 0;
  @property({ type: Object }) sectionCompletion: Map<number, boolean> = new Map();
  @property({ type: Object }) sectionSkipped: Map<number, boolean> = new Map();
  @property({ type: Boolean }) paSigned = false;
  @property({ type: Boolean }) producerSigned = false;
  @property({ type: Boolean }) isPA = false;
  @property({ type: Boolean }) isProducer = false;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      max-width: 100%;
      overflow: hidden;
      box-sizing: border-box;
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

    .card div {
      margin-bottom: 0.5rem;
    }

    .card div:last-child {
      margin-bottom: 0;
    }

    .card strong {
      font-weight: 600;
      color: var(--sl-color-neutral-700);
    }

    .section-title {
      font-weight: 600;
      color: var(--sl-color-neutral-700);
      margin-bottom: 0.5rem;
    }

    .chapters-container {
      width: 100%;
      max-width: 100%;
      overflow: hidden;
    }

    /* Review & Submit dedicated section - matches secondary button styling */
    .review-submit-section {
      margin-top: 0;
      padding: 1rem;
      background-color: #ffffff;
      border: 1px solid #1a5a96;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .review-submit-section:hover {
      background-color: #edebe9;
    }

    .review-submit-section:focus {
      background-color: #ffffff;
      outline: 3px solid #3399ff;
      outline-offset: 2px;
    }

    .review-submit-section.active {
      background-color: #F0F9FF;
    }

    .review-submit-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .review-submit-icon {
      font-size: 1.5rem;
      color: #1a5a96;
    }

    .review-submit-text {
      flex: 1;
    }

    .review-submit-title {
      font-weight: 700;
      font-size: 1rem;
      color: #1a5a96;
      margin: 0;
    }

    .review-submit-subtitle {
      font-size: 0.85rem;
      color: #000000;
      margin: 0.25rem 0 0 0;
    }

    .review-submit-arrow {
      font-size: 1.25rem;
      color: #1a5a96;
      transition: transform 0.2s ease;
    }

    .review-submit-section:hover .review-submit-arrow {
      transform: translateX(4px);
    }

    /* Ensure slotted content doesn't expand the sidebar */
    ::slotted(*) {
      width: 100%;
      max-width: 100%;
      overflow: hidden;
      box-sizing: border-box;
    }
  `;

  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);

    // Log section index changes for debugging
    if (changedProps.has('currentSectionIndex')) {
      logger.info({
        message: `Section index changed to ${this.currentSectionIndex}`,
      });
    }
  }

  private handleReviewSubmitClick() {
    // Navigate to Review & Submit section (index 1)
    logger.info({
      message: 'Review & Submit section clicked',
    });

    this.dispatchEvent(
      new CustomEvent('section-change', {
        detail: { sectionIndex: 1 },
        bubbles: true,
        composed: true,
      })
    );
  }

  // Check if the "My Workbook" section is complete (for Review & Submit readiness)
  private isWorkbookComplete(): boolean {
    // Section 0 is "My Workbook"
    return this.sectionCompletion.get(0) || false;
  }

  // Check if the current user has signed off
  private hasCurrentUserSignedOff(): boolean {
    // PA user signed off if they're PA and paSigned is true
    if (this.isPA && this.paSigned) return true;
    // Producer user signed off if they're Producer and producerSigned is true
    if (this.isProducer && this.producerSigned) return true;
    return false;
  }

  // Get the appropriate icon name based on workbook state
  private getReviewSubmitIcon(): string {
    // If current user has signed off, show checkmark
    if (this.hasCurrentUserSignedOff()) {
      return 'check-circle-fill';
    }
    // If all questions answered, show paper plane
    if (this.isWorkbookComplete()) {
      return 'send';
    }
    // In progress - show list task icon
    return 'list-task';
  }

  // Get the subtitle text based on workbook state
  private getReviewSubmitSubtitle(): string {
    if (this.hasCurrentUserSignedOff()) {
      return 'You have signed off on this workbook';
    }
    if (this.isWorkbookComplete()) {
      return 'Ready to submit your workbook';
    }
    return 'Complete all questions to submit';
  }

  render() {
    // Get the first section (My Workbook) which contains all chapters
    const myWorkbookSection = this.sections[0];
    const isReviewSubmitActive = this.currentSectionIndex === 1;
    const iconName = this.getReviewSubmitIcon();
    const subtitle = this.getReviewSubmitSubtitle();
    const hasUserSignedOff = this.hasCurrentUserSignedOff();

    return html`
      <!-- Workbook Info Card -->
      <div class="card">
        <div><strong>Workbook ID:</strong> ${this.workbookId}</div>
        <div><strong>Workbook Name:</strong> ${this.workbookName}</div>
        <div><strong>Status:</strong> ${this.workbookStatus}</div>
      </div>

      <!-- Section Title -->
      ${myWorkbookSection ? html`
        <div class="card">
          <strong class="section-title">${myWorkbookSection.title}</strong>
        </div>
      ` : ''}

      <!-- Chapters (directly displayed, no tabs) -->
      <div class="chapters-container">
        <slot name="section-0-items"></slot>
      </div>

      <!-- Review & Submit Dedicated Section -->
      <div
        class="review-submit-section ${isReviewSubmitActive ? 'active' : ''}"
        tabindex="0"
        role="button"
        aria-label="Review and Submit your Environmental Farm Plan"
        @click=${this.handleReviewSubmitClick}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.handleReviewSubmitClick();
          }
        }}
      >
        <div class="review-submit-content">
          <sl-icon
            name="${iconName}"
            class="review-submit-icon"
            style="color: ${hasUserSignedOff ? 'var(--sl-color-success-600)' : '#1a5a96'};"
          ></sl-icon>
          <div class="review-submit-text">
            <p class="review-submit-title">Review & Submit</p>
            <p class="review-submit-subtitle">${subtitle}</p>
          </div>
          <sl-icon name="arrow-right" class="review-submit-arrow"></sl-icon>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'navigation-sidebar': NavigationSidebar;
  }
}

