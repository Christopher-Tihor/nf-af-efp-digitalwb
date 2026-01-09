import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

export interface RatingOption {
  value: string;
  label: string;
  color: string;
}

export interface RatingMetadata {
  rating1OverwriteLabel?: string | null;
  rating1Description?: string | null;
  rating2OverwriteLabel?: string | null;
  rating2Description?: string | null;
  rating3OverwriteLabel?: string | null;
  rating3Description?: string | null;
  rating4OverwriteLabel?: string | null;
  rating4Description?: string | null;
}

@customElement('rating-question')
export class RatingQuestion extends LitElement {
  @property({ type: String }) questionId = '';
  @property({ type: String }) questionType = '';
  @property({ type: Array }) options: RatingOption[] = [];
  @property({ type: String }) selectedValue = '';
  @property({ type: Object }) ratingMetadata: RatingMetadata = {};
  @property({ type: Boolean }) disabled = false;

  @state() private hoveredValue = '';

  // Debug lifecycle to see when selectedValue changes
  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('selectedValue')) {
      console.log(`🎯 RatingQuestion updated for question ${this.questionId}: selectedValue = "${this.selectedValue}"`);
    }
  }

  static styles = css`
    .rating-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin: 1rem 0;
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }

    .rating-options {
      display: flex;
      gap: 0.5rem;
      align-items: stretch;
      flex-direction: row;
      width: 100%;
      box-sizing: border-box;
    }

    /* Two-column layout for Point Rating: N/A and ? stacked on left, ratings on right */
    .rating-layout {
      display: flex;
      gap: 0.5rem;
      align-items: stretch;
      width: 100%;
      box-sizing: border-box;
    }

    .rating-left-column {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 0 0 auto;
    }

    .rating-right-column {
      display: flex;
      flex-direction: row;
      gap: 0.5rem;
      flex: 1;
      align-items: stretch;
    }

    /* Compact button style (for Yes/No/NA and Point Rating without descriptions) */
    .rating-box {
      min-width: 60px;
      height: 40px;
      border: 2px solid #333;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      font-weight: 600;
      font-size: 0.9rem;
      color: #333;
      position: relative;
      user-select: none;
      padding: 0.5rem;
      box-sizing: border-box;
    }

    /* Card style (for Point Rating with descriptions) */
    .rating-card {
      flex: 1 1 0;
      min-width: 140px;
      border: 2px solid #333;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      cursor: pointer;
      transition: all 0.2s ease;
      user-select: none;
      padding: 1rem;
      text-align: left;
      position: relative;
      background-color: white;
      box-sizing: border-box;
    }

    .rating-card-header {
      font-weight: 700;
      font-size: 0.95rem;
      margin: -1rem -1rem 0 -1rem;
      padding: 0.75rem 1rem;
      border-radius: 8px 8px 0 0;
    }

    .rating-card-description {
      font-size: 0.85rem;
      line-height: 1.4;
      flex: 1;
      background-color: white;
      color: #333;
      padding: 0.75rem 0 0 0;
      font-family: 'BCSans', 'Noto Sans', Verdana, sans-serif !important;
    }

    .rating-card-description :global(*) {
      margin: 0;
      padding: 0;
      font-size: inherit;
      line-height: inherit;
      font-family: 'BCSans', 'Noto Sans', Verdana, sans-serif !important;
    }

    .rating-card-description :global(p) {
      margin-bottom: 0.5rem;
      font-family: 'BCSans', 'Noto Sans', Verdana, sans-serif !important;
    }

    .rating-card-description :global(p:last-child) {
      margin-bottom: 0;
    }

    .rating-card-description :global(div) {
      font-family: 'BCSans', 'Noto Sans', Verdana, sans-serif !important;
    }

    .rating-card-description :global(span) {
      font-family: 'BCSans', 'Noto Sans', Verdana, sans-serif !important;
    }

    /* N/A specific styles */
    .rating-box.na {
      background-color: #e0e0e0;
      color: #333;
      flex: 0 0 auto;
      min-width: 60px;
      max-width: 80px;
    }

    .rating-card.na {
      background-color: #e0e0e0;
      color: #333;
      flex: 0 0 auto;
      min-width: 70px;
      max-width: 80px;
      overflow: hidden;
    }

    .rating-card.na .rating-card-header {
      text-align: center;
      background-color: #e0e0e0;
      color: #333;
    }

    /* Unknown (?) specific styles */
    .rating-card.unknown {
      background-color: #e0e0e0;
      color: #333;
      flex: 0 0 auto;
      min-width: 70px;
      max-width: 80px;
      overflow: hidden;
    }

    .rating-card.unknown .rating-card-header {
      text-align: center;
      background-color: #e0e0e0;
      color: #333;
    }

    /* N/A and Unknown in left column for Point Rating */
    .rating-left-column .rating-card.na,
    .rating-left-column .rating-card.unknown {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .rating-left-column .rating-card.na .rating-card-header,
    .rating-left-column .rating-card.unknown .rating-card-header {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      width: 100%;
    }

    /* Disabled states */
    .rating-box.disabled,
    .rating-card.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }

    /* Hover states */
    .rating-box:hover,
    .rating-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .rating-box.disabled:hover,
    .rating-card.disabled:hover {
      transform: none;
      box-shadow: none;
    }

    /* Selected states */
    .rating-box.selected,
    .rating-card.selected {
      border-color: #000;
      border-width: 4px;
      box-shadow: 0 0 0 3px #FFD700, 0 4px 12px rgba(0, 0, 0, 0.3);
      transform: translateY(-2px);
    }

    .rating-card.selected::before {
      content: '✓';
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background-color: #FFD700;
      color: #000;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 1rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    /* Color schemes for Yes/No/NA */
    .rating-box.yes {
      background-color: #12436D;
      color: white;
    }

    .rating-box.no {
      background-color: #D4351C;
      color: white;
    }

    .rating-box.unknown {
      background-color: #e0e0e0;
      color: #333;
    }

    /* Yes/No/NA card header colors */
    .rating-card.yes .rating-card-header {
      background-color: #12436D;
      color: white;
    }

    .rating-card.no .rating-card-header {
      background-color: #D4351C;
      color: white;
    }

    .rating-card.unknown .rating-card-header {
      background-color: #e0e0e0;
      color: #333;
    }

    /* Yes/No/NA compact card styles (narrower like N/A) */
    .rating-card.yes,
    .rating-card.no,
    .rating-card.na,
    .rating-card.unknown {
      flex: 0 0 auto;
      min-width: 100px;
      max-width: 120px;
      padding: 0;
    }

    /* Make header fill entire card for Yes/No/NA/Unknown */
    .rating-card.yes .rating-card-header,
    .rating-card.no .rating-card-header,
    .rating-card.na .rating-card-header,
    .rating-card.unknown .rating-card-header {
      margin: 0;
      border-radius: 6px;
      padding: 0.75rem 1rem;
    }

    /* Color schemes for Point Rating - Blue-to-Red Sequential Scale */
    /* Compact buttons get full background color */
    .rating-box.rating-1 {
      background-color: #12436D;
      color: white;
    }

    .rating-box.rating-2 {
      background-color: #28A197;
      color: white;
    }

    .rating-box.rating-3 {
      background-color: #F46A25;
      color: white;
    }

    .rating-box.rating-4 {
      background-color: #D4351C;
      color: white;
    }

    /* Card headers get colored backgrounds */
    .rating-card.rating-1 .rating-card-header {
      background-color: #12436D;
      color: white;
    }

    .rating-card.rating-2 .rating-card-header {
      background-color: #28A197;
      color: white;
    }

    .rating-card.rating-3 .rating-card-header {
      background-color: #F46A25;
      color: white;
    }

    .rating-card.rating-4 .rating-card-header {
      background-color: #D4351C;
      color: white;
    }

    /* Legacy 5-6 point support */
    .rating-box.rating-5 {
      background-color: #4caf50;
      color: white;
    }

    .rating-box.rating-6 {
      background-color: #2e7d32;
      color: white;
    }

    /* Narrow devices - switch to vertical layout */
    @media (max-width: 992px) {
      .rating-options {
        flex-direction: column;
      }

      .rating-layout {
        flex-direction: column;
      }

      .rating-left-column {
        flex-direction: row;
        width: 100%;
      }

      .rating-left-column .rating-card.na,
      .rating-left-column .rating-card.unknown {
        flex: 0 0 auto;
        min-width: 70px;
        max-width: 80px;
      }

      .rating-right-column {
        flex-direction: column;
        width: 100%;
      }

      .rating-card {
        width: 100%;
        min-width: unset;
        flex: 0 0 auto;
      }

      .rating-card.yes,
      .rating-card.no {
        width: 100%;
        min-width: unset;
        max-width: unset;
      }

      .rating-card-header {
        font-size: 0.9rem;
      }

      .rating-card-description {
        font-size: 0.85rem;
      }
    }

    /* Mobile devices - ensure cards stay within container */
    @media (max-width: 768px) {
      .rating-container {
        padding: 0;
        margin: 0.5rem 0;
      }

      .rating-options,
      .rating-layout {
        gap: 0.5rem;
        width: 100%;
        max-width: 100%;
      }

      .rating-card {
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
        margin: 0;
        padding: 0.75rem;
      }

      .rating-card.yes,
      .rating-card.no {
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
      }

      .rating-left-column .rating-card.na,
      .rating-left-column .rating-card.unknown {
        min-width: 60px;
        max-width: 70px;
        padding: 0;
      }

      .rating-card-header {
        font-size: 0.85rem;
        padding: 0.5rem 0.75rem;
      }

      .rating-card-description {
        font-size: 0.8rem;
        padding: 0.5rem 0.75rem;
      }
    }
  `;

  private getDefaultOptions(questionType: string): RatingOption[] {
    switch (questionType) {
      case 'Yes/No/NA':
        return [
          { value: 'yes', label: 'Yes', color: 'yes' },
          { value: 'no', label: 'No', color: 'no' },
          { value: 'na', label: 'N/A', color: 'na' },
          { value: 'unknown', label: '?', color: 'unknown' }
        ];

      case 'Point Rating':
        // 4-point system with N/A and Unknown options first
        const options: RatingOption[] = [
          { value: 'na', label: 'N/A', color: 'na' },
          { value: 'unknown', label: '?', color: 'unknown' },
          { value: '1', label: this.ratingMetadata?.rating1OverwriteLabel || '1', color: 'rating-1' },
          { value: '2', label: this.ratingMetadata?.rating2OverwriteLabel || '2', color: 'rating-2' },
          { value: '3', label: this.ratingMetadata?.rating3OverwriteLabel || '3', color: 'rating-3' },
          { value: '4', label: this.ratingMetadata?.rating4OverwriteLabel || '4', color: 'rating-4' }
        ];
        return options;

      default:
        return [];
    }
  }

  private handleOptionClick(value: string) {
    if (this.disabled) return;

    this.selectedValue = value;

    // Dispatch custom event for parent component
    this.dispatchEvent(new CustomEvent('rating-changed', {
      detail: {
        questionId: this.questionId,
        value: value
      },
      bubbles: true,
      composed: true
    }));
  }

  private handleMouseEnter(value: string) {
    this.hoveredValue = value;
  }

  private handleMouseLeave() {
    this.hoveredValue = '';
  }

  private hasRatingDescriptions(): boolean {
    if (this.questionType !== 'Point Rating') return false;

    return !!(
      this.ratingMetadata?.rating1Description ||
      this.ratingMetadata?.rating2Description ||
      this.ratingMetadata?.rating3Description ||
      this.ratingMetadata?.rating4Description
    );
  }

  private getRatingLabel(ratingNum: number): string {
    const labelKey = `rating${ratingNum}OverwriteLabel` as keyof RatingMetadata;
    return this.ratingMetadata?.[labelKey] || `Risk Rating ${ratingNum}`;
  }

  private getRatingDescription(ratingNum: number): string {
    const descKey = `rating${ratingNum}Description` as keyof RatingMetadata;
    let description = this.ratingMetadata?.[descKey] || '';

    // Remove inline font-family styles that override our CSS
    if (description) {
      description = description.replace(/font-family:\s*[^;}"']+;?/gi, '');
      description = description.replace(/font-size:\s*[^;}"']+;?/gi, '');
    }

    return description;
  }

  private renderRatingOption(option: RatingOption) {
    const isSelected = this.selectedValue === option.value;
    const isNA = option.value === 'na';
    const isUnknown = option.value === 'unknown';

    // For Point Rating, always use card layout (with or without descriptions)
    if (this.questionType === 'Point Rating') {
      // N/A card (compact, no description)
      if (isNA) {
        return html`
          <div
            class="rating-card na ${isSelected ? 'selected' : ''} ${this.disabled ? 'disabled' : ''}"
            @click=${() => this.handleOptionClick(option.value)}
            title="Not Applicable"
          >
            <div class="rating-card-header">N/A</div>
          </div>
        `;
      }

      // Unknown card (compact, no description)
      if (isUnknown) {
        return html`
          <div
            class="rating-card unknown ${isSelected ? 'selected' : ''} ${this.disabled ? 'disabled' : ''}"
            @click=${() => this.handleOptionClick(option.value)}
            title="Unknown"
          >
            <div class="rating-card-header">?</div>
          </div>
        `;
      }

      // Rating cards with descriptions
      const ratingNum = parseInt(option.value);
      const label = this.getRatingLabel(ratingNum);
      const description = this.getRatingDescription(ratingNum);

      return html`
        <div
          class="rating-card ${option.color} ${isSelected ? 'selected' : ''} ${this.disabled ? 'disabled' : ''}"
          @click=${() => this.handleOptionClick(option.value)}
          title="${label}"
        >
          <div class="rating-card-header">${label}</div>
          ${description ? html`
            <div class="rating-card-description">
              ${unsafeHTML(description)}
            </div>
          ` : ''}
        </div>
      `;
    }

    // For Yes/No/NA, use card layout consistent with Point Rating
    if (this.questionType === 'Yes/No/NA') {
      // N/A and Unknown cards (compact, no description)
      if (isNA || isUnknown) {
        return html`
          <div
            class="rating-card ${option.color} ${isSelected ? 'selected' : ''} ${this.disabled ? 'disabled' : ''}"
            @click=${() => this.handleOptionClick(option.value)}
            title="${isNA ? 'Not Applicable' : 'Unknown'}"
          >
            <div class="rating-card-header">${option.label}</div>
          </div>
        `;
      }

      // Yes/No cards
      return html`
        <div
          class="rating-card ${option.color} ${isSelected ? 'selected' : ''} ${this.disabled ? 'disabled' : ''}"
          @click=${() => this.handleOptionClick(option.value)}
          title="${option.label}"
        >
          <div class="rating-card-header">${option.label}</div>
        </div>
      `;
    }

    // Fallback: use compact button layout
    return html`
      <div
        class="rating-box ${option.color} ${isSelected ? 'selected' : ''} ${this.disabled ? 'disabled' : ''}"
        @click=${() => this.handleOptionClick(option.value)}
        @mouseenter=${() => this.handleMouseEnter(option.value)}
        @mouseleave=${this.handleMouseLeave}
        title="${option.label}"
      >
        ${option.label}
      </div>
    `;
  }

  render() {
    const optionsToRender = this.options.length > 0
      ? this.options
      : this.getDefaultOptions(this.questionType);

    // For Point Rating, use two-column layout with N/A and ? stacked on left
    if (this.questionType === 'Point Rating') {
      const leftColumnOptions = optionsToRender.filter(o => o.value === 'na' || o.value === 'unknown');
      const rightColumnOptions = optionsToRender.filter(o => o.value !== 'na' && o.value !== 'unknown');

      return html`
        <div class="rating-container">
          <div class="rating-layout">
            <div class="rating-left-column">
              ${leftColumnOptions.map(option => this.renderRatingOption(option))}
            </div>
            <div class="rating-right-column">
              ${rightColumnOptions.map(option => this.renderRatingOption(option))}
            </div>
          </div>
        </div>
      `;
    }

    return html`
      <div class="rating-container">
        <div class="rating-options">
          ${optionsToRender.map(option => this.renderRatingOption(option))}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rating-question': RatingQuestion;
  }
}
