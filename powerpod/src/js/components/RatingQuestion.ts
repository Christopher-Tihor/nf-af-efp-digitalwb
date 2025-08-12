import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

export interface RatingOption {
  value: string;
  label: string;
  color: string;
}

@customElement('rating-question')
export class RatingQuestion extends LitElement {
  @property({ type: String }) questionId = '';
  @property({ type: String }) questionType = '';
  @property({ type: Array }) options: RatingOption[] = [];
  @property({ type: String }) selectedValue = '';
  
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
    }

    .rating-options {
      display: flex;
      gap: 2px;
      align-items: center;
      flex-wrap: wrap;
    }

    .rating-box {
      width: 60px;
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
    }

    .rating-box:hover {
      transform: scale(1.05);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .rating-box.selected {
      border-color: #000;
      border-width: 3px;
      transform: scale(1.02);
    }

    .rating-box.yes {
      background-color: #8bc34a;
      color: white;
    }

    .rating-box.no {
      background-color: #f44336;
      color: white;
    }

    .rating-box.unknown {
      background-color: #ffeb3b;
      color: #333;
    }

    .rating-box.na {
      background-color: #d4c5a0;
      color: #333;
    }

    .rating-box.rating-1 {
      background-color: #f44336;
      color: white;
    }

    .rating-box.rating-2 {
      background-color: #ff9800;
      color: white;
    }

    .rating-box.rating-3 {
      background-color: #ffeb3b;
      color: #333;
    }

    .rating-box.rating-4 {
      background-color: #8bc34a;
      color: white;
    }

    .rating-box.rating-5 {
      background-color: #4caf50;
      color: white;
    }

    .rating-box.rating-6 {
      background-color: #2e7d32;
      color: white;
    }

    .rating-label {
      font-size: 0.8rem;
      margin-top: 0.25rem;
      text-align: center;
      color: var(--sl-color-neutral-600);
    }

    @media (max-width: 768px) {
      .rating-options {
        justify-content: center;
      }
      
      .rating-box {
        width: 50px;
        height: 35px;
        font-size: 0.8rem;
      }
    }
  `;

  private getDefaultOptions(questionType: string): RatingOption[] {
    switch (questionType) {
      case 'Yes/No/NA':
        return [
          { value: 'yes', label: 'Yes', color: 'yes' },
          { value: 'no', label: 'No', color: 'no' },
          { value: 'unknown', label: '?', color: 'unknown' },
          { value: 'na', label: 'N/A', color: 'na' }
        ];
      
      case 'Point Rating':
        return [
          { value: '1', label: '1', color: 'rating-1' },
          { value: '2', label: '2', color: 'rating-2' },
          { value: '3', label: '3', color: 'rating-3' },
          { value: '4', label: '4', color: 'rating-4' },
          { value: '5', label: '5', color: 'rating-5' },
          { value: '6', label: '6', color: 'rating-6' }
        ];
      
      default:
        return [];
    }
  }

  private handleOptionClick(value: string) {
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

  render() {
    const optionsToRender = this.options.length > 0 
      ? this.options 
      : this.getDefaultOptions(this.questionType);

    return html`
      <div class="rating-container">
        <div class="rating-options">
          ${optionsToRender.map(option => html`
            <div
              class="rating-box ${option.color} ${this.selectedValue === option.value ? 'selected' : ''}"
              @click=${() => this.handleOptionClick(option.value)}
              @mouseenter=${() => this.handleMouseEnter(option.value)}
              @mouseleave=${this.handleMouseLeave}
              title="${option.label}"
            >
              ${option.label}
            </div>
          `)}
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
