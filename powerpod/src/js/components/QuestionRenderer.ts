import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';
import './RatingQuestion';
import { Logger } from '../common/logger.js';
import { POWERPOD } from '../common/constants.js';
import { WorkbookResponseService } from '../services/WorkbookResponseService.js';
import { EFPTextUtils } from './efp/text-utils.js';

const logger = Logger('components/QuestionRenderer');

// Question type constants
const QUESTION_TYPE_MAP: { [key: number]: string } = {
  100000000: 'Yes/No/NA',
  100000001: 'Point Rating',
  100000002: 'Multi-select List',
  100000003: 'Multiline Text',
};

/**
 * Component responsible for rendering individual questions
 * Handles different question types and their interactions
 */
@customElement('question-renderer')
export class QuestionRenderer extends LitElement {
  @property({ type: Object }) question: any = null;
  @property({ type: Boolean }) isDisabled: boolean = false;
  @property({ type: Boolean }) hasTriedToSubmit: boolean = false;
  @property({ type: Object }) responseService: WorkbookResponseService | null = null;
  @property({ type: Number }) actionPlanCount: number = 0;
  @property({ type: Object }) existingResponse: any = null;
  // Counter to force re-renders when save status changes
  @property({ type: Number }) updateCounter: number = 0;

  // Disable Shadow DOM so this component inherits styles from parent EFPEntryForm
  createRenderRoot() {
    return this;
  }

  // Get the question type name from the numeric type
  private getQuestionTypeName(): string {
    if (!this.question) return 'Unknown';
    return QUESTION_TYPE_MAP[this.question.questionType] || 'Unknown';
  }

  // Check if this question is incomplete
  private isIncomplete(): boolean {
    if (!this.question) return false;
    const entry = POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.get(this.question.id);
    const isSkipped = entry?.response?.quartech_chapterskipped === 100000000;
    const hasResponse = entry?.response?.quartech_response &&
                       entry.response.quartech_response.trim() !== '';
    return !isSkipped && !hasResponse;
  }

  // Emit event for rating changes
  private handleRatingChanged(event: CustomEvent) {
    this.dispatchEvent(new CustomEvent('rating-changed', {
      detail: event.detail,
      bubbles: true,
      composed: true,
    }));
  }

  // Emit event for multiselect changes
  private handleMultiselectChange(questionId: string, option: string, checked: boolean) {
    this.dispatchEvent(new CustomEvent('multiselect-changed', {
      detail: { questionId, option, checked },
      bubbles: true,
      composed: true,
    }));
  }

  // Emit event for multiline text input
  private handleMultilineTextInput(questionId: string, value: string) {
    this.dispatchEvent(new CustomEvent('multiline-text-input', {
      detail: { questionId, value },
      bubbles: true,
      composed: true,
    }));
  }

  // Emit event for force save
  private handleForceSave(questionId: string) {
    this.dispatchEvent(new CustomEvent('force-save', {
      detail: { questionId },
      bubbles: true,
      composed: true,
    }));
  }

  // Emit event for adding note to action plan
  private handleAddNoteToActionPlan() {
    if (!this.question) return;
    this.dispatchEvent(new CustomEvent('add-note-to-action-plan', {
      detail: { questionId: this.question.id },
      bubbles: true,
      composed: true,
    }));
  }

  // Emit event for viewing existing actions
  private handleViewExistingActions() {
    if (!this.question) return;
    this.dispatchEvent(new CustomEvent('view-existing-actions', {
      detail: { questionId: this.question.id },
      bubbles: true,
      composed: true,
    }));
  }

  // Render action plan buttons
  private renderActionPlanButtons() {
    const hasActionPlans = this.actionPlanCount > 0;

    return html`
      <div class="question-action-plan-button">
        ${hasActionPlans
          ? html`
              <button
                class="view-actions-button"
                @click=${this.handleViewExistingActions}
                ?disabled=${this.isDisabled}
              >
                <sl-icon name="eye" aria-hidden="true"></sl-icon>
                <span>View Existing Actions</span>
                <sl-badge variant="primary" pill>${this.actionPlanCount}</sl-badge>
              </button>
            `
          : ''}
        <button
          class="add-note-button"
          @click=${this.handleAddNoteToActionPlan}
          ?disabled=${this.isDisabled}
        >
          <sl-icon name="journal-plus" aria-hidden="true"></sl-icon>
          <span>Add Note to Action Plan</span>
        </button>
      </div>
    `;
  }

  // Render the question input based on question type
  private renderQuestionInput() {
    const questionType = this.getQuestionTypeName();

    switch (questionType) {
      case 'Multi-select List':
        return this.renderMultiselectInput();
      case 'Yes/No/NA':
      case 'Point Rating':
        return this.renderRatingInput(questionType);
      case 'Multiline Text':
        return this.renderMultilineTextInput();
      default:
        return this.renderDefaultInput();
    }
  }

  // Render the save status indicator
  private renderSaveStatusIndicator() {
    const saveStatus = this.responseService?.getSaveStatus(this.question.id) || 'saved';

    // Only show indicator when saving or just saved (not for unsaved questions)
    if (saveStatus === 'saved' && !this.existingResponse?.quartech_response) {
      return html``;
    }

    return html`
      <div class="save-status-indicator">
        <span
          class="status-indicator status-${saveStatus}"
          @click=${() => this.handleForceSave(this.question.id)}
          role="button"
          tabindex="0"
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              this.handleForceSave(this.question.id);
            }
          }}
        >
          ${saveStatus === 'saving'
            ? '⏳ Saving...'
            : '✓ Saved'}
        </span>
      </div>
    `;
  }

  // Render multiselect list input
  private renderMultiselectInput() {
    const optionsString = this.question.multiselectOptions || '';
    const options = optionsString
      .split(';')
      .map((opt: string) => opt.trim())
      .filter((opt: string) => opt.length > 0);

    // Get selected options - prefer pending value from service over saved response
    let selectedOptions: string[];
    const pendingValues = this.responseService?.getPendingMultiselectValues(this.question.id);
    if (pendingValues) {
      selectedOptions = pendingValues;
    } else {
      const selectedOptionsString = this.existingResponse?.quartech_response || '';
      const existingSelectedOptions = selectedOptionsString
        .split(';')
        .map((opt: string) => opt.trim())
        .filter((opt: string) => opt.length > 0);

      // Filter to only include valid options
      selectedOptions = existingSelectedOptions.filter((opt: string) =>
        options.includes(opt)
      );
    }

    return html`
      <div class="multiselect-list-container">
        ${options.map((option: string) => {
          const isChecked = selectedOptions.includes(option);
          return html`
            <div class="multiselect-option">
              <label
                style="display: flex; align-items: center; gap: 0.5rem; cursor: ${this.isDisabled ? 'not-allowed' : 'pointer'}; padding: 0.5rem 0; opacity: ${this.isDisabled ? '0.6' : '1'};"
              >
                <input
                  type="checkbox"
                  .checked=${isChecked}
                  ?disabled=${this.isDisabled}
                  @change=${(e: Event) =>
                    this.handleMultiselectChange(
                      this.question.id,
                      option,
                      (e.target as HTMLInputElement).checked
                    )}
                  style="transform: scale(1.2);"
                />
                <span>${option}</span>
              </label>
            </div>
          `;
        })}
        ${this.renderSaveStatusIndicator()}
      </div>
    `;
  }

  // Render rating input (Yes/No/NA or Point Rating)
  private renderRatingInput(questionType: string) {
    const selectedValue = this.existingResponse?.quartech_response || '';

    const ratingMetadata =
      questionType === 'Point Rating'
        ? {
            rating1OverwriteLabel: this.question.rating1OverwriteLabel,
            rating1Description: this.question.rating1Description,
            rating2OverwriteLabel: this.question.rating2OverwriteLabel,
            rating2Description: this.question.rating2Description,
            rating3OverwriteLabel: this.question.rating3OverwriteLabel,
            rating3Description: this.question.rating3Description,
            rating4OverwriteLabel: this.question.rating4OverwriteLabel,
            rating4Description: this.question.rating4Description,
          }
        : {};

    return html`
      <div class="rating-input-container">
        <rating-question
          .questionId=${this.question.id}
          .questionType=${questionType}
          .selectedValue=${selectedValue}
          .ratingMetadata=${ratingMetadata}
          .disabled=${this.isDisabled}
          @rating-changed=${this.handleRatingChanged}
        ></rating-question>
        ${this.renderSaveStatusIndicator()}
      </div>
    `;
  }

  // Render multiline text input
  private renderMultilineTextInput() {
    const textValue = this.existingResponse?.quartech_response || '';
    const saveStatus = this.responseService?.getMultilineTextSaveStatus(this.question.id) || 'saved';
    const charCount = this.responseService?.getMultilineTextCharCount(this.question.id) ?? textValue.length;
    const maxChars = 5000;
    const isOverLimit = charCount > maxChars;

    return html`
      <div class="multiline-text-container">
        <sl-textarea
          label="Your response"
          name="question-${this.question.id}"
          rows="6"
          placeholder="Enter your response..."
          maxlength="${maxChars}"
          .value=${textValue}
          ?disabled=${this.isDisabled}
          @sl-input=${(e: Event) =>
            this.handleMultilineTextInput(
              this.question.id,
              (e.target as any).value
            )}
        ></sl-textarea>
        <div class="multiline-text-footer">
          <div class="character-counter ${isOverLimit ? 'over-limit' : ''}">
            ${charCount} / ${maxChars} characters
          </div>
          <div class="multiline-text-status">
            <span
              class="status-indicator status-${saveStatus}"
              @click=${() => this.handleForceSave(this.question.id)}
              role="button"
              tabindex="0"
              @keydown=${(e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  this.handleForceSave(this.question.id);
                }
              }}
            >
              ${saveStatus === 'draft'
                ? '📝 Draft (click to save)'
                : saveStatus === 'saving'
                ? '⏳ Saving...'
                : '✓ Saved'}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  // Render default text input for unknown types
  private renderDefaultInput() {
    return html`
      <sl-textarea
        label="Your response"
        name="question-${this.question.id}"
        rows="3"
        placeholder="Enter your response..."
        ?disabled=${this.isDisabled}
      ></sl-textarea>
    `;
  }

  // Main render method
  render() {
    if (!this.question) {
      return html``;
    }

    const showIncompleteIcon = this.isIncomplete() && this.hasTriedToSubmit;

    return html`
      <div
        class="question-container ${this.isDisabled ? 'question-disabled' : ''}"
        data-question-id="${this.question.id}"
      >
        ${this.question.textAboveQuestion
          ? html`
              <div class="question-text">
                ${unsafeHTML(this.question.textAboveQuestion)}
              </div>
            `
          : ''}

        <div class="question-label">
          <div class="question-label-text">
            <span
              >${unsafeHTML(
                EFPTextUtils.convertNewlinesToBreaks(this.question.label)
              )}</span
            >
            ${this.question.tooltip
              ? html`
                  <sl-tooltip placement="top" style="--max-width: 300px;">
                    <div slot="content">${unsafeHTML(this.question.tooltip)}</div>
                    <sl-icon
                      name="question-circle"
                      class="question-tooltip-icon"
                      aria-label="Question help"
                    ></sl-icon>
                  </sl-tooltip>
                `
              : ''}
          </div>
          ${showIncompleteIcon
            ? html`
                <sl-icon
                  name="exclamation-circle"
                  class="question-incomplete-icon"
                  aria-label="Incomplete question"
                ></sl-icon>
              `
            : ''}
        </div>

        ${this.question.textBelowQuestion
          ? html`
              <div class="question-text">
                ${unsafeHTML(this.question.textBelowQuestion)}
              </div>
            `
          : ''}

        <div class="question-response">
          ${this.renderQuestionInput()}
        </div>

        ${this.renderActionPlanButtons()}
      </div>
    `;
  }
}
