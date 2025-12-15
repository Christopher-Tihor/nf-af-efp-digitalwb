import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import '@shoelace-style/shoelace/dist/components/details/details.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';
import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js';
import '@shoelace-style/shoelace/dist/components/tab/tab.js';
import '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';

import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import './NavigationButtons';
import './RatingQuestion';
import './EFPBreadcrumbs';
import './WorkbookSignOffButtons';
import './ActionPlanTable';
import WorkbookResponseHelper from '../common/workbookResponseHelper.js';
import { getWorkbookId, getWorkbookData } from '../common/workbookUtils.js';
import { POWERPOD, YES_VALUE } from '../common/constants.js';
import { Logger } from '../common/logger.js';
import store from '../store/index.js';
import {
  getQuestionnaireFromStore,
  getChapterFromStore,
  getQuestionFromStore,
  updateQuestionResponse,
  isQuestionnaireLoaded,
  updateChapterCompletion,
} from '../common/questionnaire.js';
import { EFPEventUtils } from './efp/event-utils.js';
import { EFPTextUtils } from './efp/text-utils.js';
import { EFPCompletionUtils } from './efp/completion-utils.js';
import { EFPNavigationUtils } from './efp/navigation-utils.js';
import { EFPLifecycleUtils } from './efp/lifecycle-utils.js';
import { EFPSectionGenerator } from './efp/section-generator.js';
import { EFPRenderUtils } from './efp/render-utils.js';

import { efpEntryFormStyles } from './EFPEntryForm.styles';

// Shared type definitions
import {
  EFPStep,
  EFPSection,
  EFPSectionItem,
  QuestionsAndResponsesMemory,
} from './efp/types.js';

interface EFPActiveContent {
  title: string;
  content: string;
}

// Create logger instance for EFP components
const logger = Logger('components/EFPEntryForm');

@customElement('efp-entry-form')
export class EFPEntryForm extends LitElement {
  @property({ type: Number }) currentSectionIndex = 0;
  @property({ type: Number }) currentStepIndex = 0;
  @property({ type: Array, attribute: false }) nestedChapterStructure: any[] =
    [];
  @property({ type: Array, attribute: false }) workbookResponses: any[] = [];
  @property({ type: Boolean, attribute: false }) isLoadingResponses = false;
  @property({ type: Boolean, attribute: false }) questionnaireStoreLoaded =
    false;
  @property({ type: Boolean, attribute: false }) questionsAndResponsesLoaded =
    false;
  @property({ type: Boolean, attribute: false }) workbookLocked = false;
  @property({ type: Boolean, attribute: false }) showValidationAlert = false;
  @property({ type: Array, attribute: false }) incompleteChapters: Array<{id: string, name: string}> = [];
  @property({ type: Number, attribute: false }) responseUpdateCounter = 0; // Triggers re-render when responses change
  private isNavigating = false; // Flag to prevent tab change interference
  @property({ type: Object }) activeContent: EFPActiveContent = {
    title: 'Introduction to the Environmental Farm Plan (EFP)',
    content:
      'The purpose of the EFP is to assess the features and management of your farm to identify environmental risks and develop an action plan.',
  };
  @query('sl-tab-group') tabGroupEl!: HTMLElement & {
    show: (tabName: string) => void;
  };

  // Debounce timers for all response saves (questionId -> timer)
  private responseSaveDebounceTimers: Map<string, number> = new Map();
  // Pending response values (questionId -> response value)
  private pendingResponseValues: Map<string, string> = new Map();
  // Pending multi-select values (questionId -> selected options array)
  private pendingMultiselectValues: Map<string, string[]> = new Map();
  // Multiline text save status (questionId -> 'draft' | 'saving' | 'saved')
  @property({ type: Object, attribute: false })
  private multilineTextSaveStatus: Map<string, 'draft' | 'saving' | 'saved'> =
    new Map();
  // Multiline text character counts (questionId -> character count)
  @property({ type: Object, attribute: false })
  private multilineTextCharCounts: Map<string, number> = new Map();

  connectedCallback() {
    super.connectedCallback();
    logger.info({ message: 'EFPEntryForm connected' });

    // Check if questionnaire store is already loaded
    this.updateQuestionnaireStoreStatus();

    // Set up periodic check for questionnaire store loading
    this.setupQuestionnaireStoreWatcher();

    // Check and update workbook lock status
    this.updateWorkbookLockStatus();

    // Listen for sign-off changes to update lock status
    this.addEventListener('sign-off-changed', this.handleSignOffChanged as EventListener);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // Remove event listener
    this.removeEventListener('sign-off-changed', this.handleSignOffChanged as EventListener);

    // Clear all pending debounce timers
    this.responseSaveDebounceTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    this.responseSaveDebounceTimers.clear();
    this.pendingResponseValues.clear();
    this.pendingMultiselectValues.clear();

    logger.info({
      message: 'EFPEntryForm disconnected, cleared pending timers',
    });
  }

  // Handle sign-off changed event
  private handleSignOffChanged = (event: CustomEvent) => {
    logger.info({
      message: 'Sign-off changed, updating workbook lock status',
      data: event.detail,
    });

    // Update workbook lock status when sign-off changes
    this.updateWorkbookLockStatus();
  };

  // Update the reactive property based on store status
  private updateQuestionnaireStoreStatus() {
    const wasLoaded = this.questionnaireStoreLoaded;
    this.questionnaireStoreLoaded = isQuestionnaireLoaded();

    if (!wasLoaded && this.questionnaireStoreLoaded) {
      logger.info({
        message: '📋 Questionnaire store loaded, updating navigation',
      });

      this.requestUpdate(); // Force re-render when store becomes available
    }
  }

  // Set up watcher for questionnaire store loading
  private setupQuestionnaireStoreWatcher() {
    // Check every 500ms if store is loaded (only if not already loaded)
    const checkInterval = setInterval(() => {
      if (!this.questionnaireStoreLoaded) {
        this.updateQuestionnaireStoreStatus();
      } else {
        clearInterval(checkInterval); // Stop checking once loaded
      }
    }, 500);

    // Clear interval after 30 seconds to prevent infinite checking
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 30000);
  }

  // Check if workbook is locked based on sign-offs
  private isWorkbookLocked(): boolean {
    const workbookData = getWorkbookData();
    if (!workbookData) return false;

    const YES_INT = parseInt(YES_VALUE, 10); // 100000000

    // Workbook is locked if either PA or Producer has signed off
    const paSigned = workbookData.quartech_pasigned === YES_INT;
    const producerSigned = workbookData.quartech_producersigned === YES_INT;

    return paSigned || producerSigned;
  }

  // Update workbook lock status in component state and store
  private updateWorkbookLockStatus() {
    const isLocked = this.isWorkbookLocked();

    // Update component state
    this.workbookLocked = isLocked;

    // Update store
    store.dispatch('setWorkbookLocked', { locked: isLocked });

    logger.info({
      message: 'Updated workbook lock status',
      data: { workbookLocked: isLocked },
    });
  }

  // Check if all non-skipped questions in My Workbook are answered
  private canAccessReviewAndSubmit(): boolean {
    if (!POWERPOD.workbookQuestionsAndResponses.isLoaded) {
      // If data not loaded yet, allow access (will show loading state)
      return true;
    }

    const questionnaire = getQuestionnaireFromStore();
    if (!questionnaire?.chapters?.length) {
      return true;
    }

    // Check all questions in all chapters
    let hasUnansweredQuestions = false;
    const incompleteChaptersList: Array<{id: string, name: string}> = [];

    const checkChapters = (chapters: any[], parentName: string = '') => {
      chapters.forEach((chapter: any) => {
        let chapterHasUnanswered = false;

        // Check questions in this chapter
        if (chapter.questions && chapter.questions.length > 0) {
          chapter.questions.forEach((question: any) => {
            const entry = POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.get(question.id);
            const isSkipped = entry?.response?.quartech_chapterskipped === 100000000;
            const hasResponse = entry?.response?.quartech_response &&
                               entry.response.quartech_response.trim() !== '';

            // Question is incomplete if it's not skipped AND has no response
            if (!isSkipped && !hasResponse) {
              hasUnansweredQuestions = true;
              chapterHasUnanswered = true;
            }
          });
        }

        // If this chapter has unanswered questions, add it to the list
        if (chapterHasUnanswered) {
          const chapterName = chapter.name || chapter.quartech_name || 'Unknown Chapter';
          incompleteChaptersList.push({
            id: chapter.id,
            name: chapterName
          });
        }

        // Recursively check subchapters
        if (chapter.subchapters && chapter.subchapters.length > 0) {
          checkChapters(chapter.subchapters, chapter.name || '');
        }
      });
    };

    if (questionnaire.chapters && questionnaire.chapters.length > 0) {
      checkChapters(questionnaire.chapters[0]);
    }

    // Update the incomplete chapters list
    this.incompleteChapters = incompleteChaptersList;

    return !hasUnansweredQuestions;
  }

  // Show validation alert with incomplete chapters
  private showIncompleteQuestionsAlert() {
    this.showValidationAlert = true;

    logger.info({
      message: 'Showing validation alert for incomplete questions',
      data: {
        incompleteChaptersCount: this.incompleteChapters.length,
        incompleteChapters: this.incompleteChapters
      },
    });

    // Open the dialog
    this.updateComplete.then(() => {
      const dialog = this.shadowRoot?.querySelector('sl-dialog');
      if (dialog) {
        (dialog as any).show();
      }
    });
  }

  // Hide validation alert
  private hideValidationAlert() {
    this.showValidationAlert = false;
  }

  static styles = efpEntryFormStyles;

  private get sections(): EFPSection[] {
    return [
      {
        tab: 'My Workbook',
        title: 'Environmental Farm Plan Questionnaire',
        items: this.getSectionBItemsFromStore(),
      },
      {
        tab: 'Review & Submit',
        title: 'Declaration & Consent',
        items: this.getSectionCItemsFromPortalPage(),
      },
    ];
  }

  // Rendering methods
  private renderQuestion(question: any) {
    const questionTypeMap: { [key: number]: string } = {
      100000000: 'Yes/No/NA',
      100000001: 'Point Rating',
      100000002: 'Multi-select List',
      100000003: 'Multiline Text',
      // Add more question types as needed
    };

    const questionTypeName =
      questionTypeMap[question.questionType] || 'Unknown';

    // Check if this question is disabled (in a skipped chapter)
    const isDisabled = this.isQuestionDisabled(question.id);

    return html`
      <div
        class="question-container ${isDisabled ? 'question-disabled' : ''}"
        data-question-id="${question.id}"
      >
        ${question.textAboveQuestion
          ? html`
              <div class="question-text">
                ${unsafeHTML(question.textAboveQuestion)}
              </div>
            `
          : ''}

        <div class="question-label">
          <span
            >${unsafeHTML(
              EFPTextUtils.convertNewlinesToBreaks(question.label)
            )}</span
          >
          ${question.tooltip
            ? html`
                <sl-tooltip placement="top" style="--max-width: 300px;">
                  <div slot="content">${unsafeHTML(question.tooltip)}</div>
                  <sl-icon
                    name="question-circle"
                    class="question-tooltip-icon"
                    aria-label="Question help"
                  ></sl-icon>
                </sl-tooltip>
              `
            : ''}
        </div>

        ${question.textBelowQuestion
          ? html`
              <div class="question-text">
                ${unsafeHTML(question.textBelowQuestion)}
              </div>
            `
          : ''}

        <div class="question-response">
          ${this.renderQuestionInput(question, questionTypeName, isDisabled)}
        </div>
      </div>
    `;
  }

  private renderQuestionInput(question: any, questionType: string, isDisabled: boolean = false) {
    switch (questionType) {
      case 'Multi-select List':
        // Parse the semicolon-separated options from the question
        const optionsString = question.multiselectOptions || '';
        const options = optionsString
          .split(';')
          .map((opt: string) => opt.trim())
          .filter((opt: string) => opt.length > 0);

        // Get selected options - prefer pending value over saved response
        let selectedOptions: string[];
        if (this.pendingMultiselectValues.has(question.id)) {
          // Use pending value if user is actively selecting
          selectedOptions = this.pendingMultiselectValues.get(question.id)!;
        } else {
          // Otherwise get from existing response
          const existingResponse = this.getResponseForQuestion(question.id);
          const selectedOptionsString =
            existingResponse?.quartech_response || '';
          const existingSelectedOptions = selectedOptionsString
            .split(';')
            .map((opt: string) => opt.trim())
            .filter((opt: string) => opt.length > 0);

          // Filter to only include options that are valid for the current question
          // This prevents old/invalid options from being displayed as checked
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
                    style="display: flex; align-items: center; gap: 0.5rem; cursor: ${isDisabled ? 'not-allowed' : 'pointer'}; padding: 0.5rem 0; opacity: ${isDisabled ? '0.6' : '1'};"
                  >
                    <input
                      type="checkbox"
                      .checked=${isChecked}
                      ?disabled=${isDisabled}
                      @change=${(e: Event) =>
                        this.handleMultiselectChange(
                          question.id,
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
          </div>
        `;

      case 'Yes/No/NA':
      case 'Point Rating':
        // Get existing response value for this question
        const existingResponse2 = this.getResponseForQuestion(question.id);
        const selectedValue = existingResponse2?.quartech_response || '';

        // Prepare rating metadata for Point Rating questions
        const ratingMetadata =
          questionType === 'Point Rating'
            ? {
                rating1OverwriteLabel: question.rating1OverwriteLabel,
                rating1Description: question.rating1Description,
                rating2OverwriteLabel: question.rating2OverwriteLabel,
                rating2Description: question.rating2Description,
                rating3OverwriteLabel: question.rating3OverwriteLabel,
                rating3Description: question.rating3Description,
                rating4OverwriteLabel: question.rating4OverwriteLabel,
                rating4Description: question.rating4Description,
              }
            : {};

        return html`
          <rating-question
            .questionId=${question.id}
            .questionType=${questionType}
            .selectedValue=${selectedValue}
            .ratingMetadata=${ratingMetadata}
            .disabled=${isDisabled}
            @rating-changed=${this.handleRatingChanged}
          ></rating-question>
        `;

      case 'Multiline Text':
        // Get existing response value for this question
        const existingResponse3 = this.getResponseForQuestion(question.id);
        const textValue = existingResponse3?.quartech_response || '';
        const saveStatus =
          this.multilineTextSaveStatus.get(question.id) || 'saved';

        // Use tracked character count if available, otherwise use text value length
        const charCount = this.multilineTextCharCounts.has(question.id)
          ? this.multilineTextCharCounts.get(question.id)!
          : textValue.length;
        const maxChars = 5000;
        const isOverLimit = charCount > maxChars;

        return html`
          <div class="multiline-text-container">
            <sl-textarea
              label="Your response"
              name="question-${question.id}"
              rows="6"
              placeholder="Enter your response..."
              maxlength="${maxChars}"
              .value=${textValue}
              ?disabled=${isDisabled}
              @sl-input=${(e: Event) =>
                this.handleMultilineTextInput(
                  question.id,
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
                  @click=${() => this.handleForceSave(question.id)}
                  role="button"
                  tabindex="0"
                  @keydown=${(e: KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      this.handleForceSave(question.id);
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

      default:
        return html`
          <sl-textarea
            label="Your response"
            name="question-${question.id}"
            rows="3"
            placeholder="Enter your response..."
            ?disabled=${isDisabled}
          ></sl-textarea>
        `;
    }
  }

  private renderSectionNotApplicableCheckbox() {
    // Only show checkbox when viewing a chapter/subchapter in My Workbook section
    if (this.currentSectionIndex === 0) {
      const currentStep = this.flatSteps[this.currentStepIndex];
      // Check if current step is a chapter, subchapter, or sub-subchapter
      // This includes: container chapters (isContainer), leaf chapters (chapterData), and subchapters (subchapterData)
      // Also check if the checkbox should be hidden for this specific step
      if (currentStep &&
          (currentStep.chapterData || currentStep.subchapterData || currentStep.isContainer) &&
          !currentStep.hideSkipChapterCheckbox) {

        const isSkipped = this.isChapterSkipped();

        return html`
          <div class="section-not-applicable">
            <sl-checkbox
              ?checked=${isSkipped}
              ?disabled=${this.workbookLocked}
              @sl-change=${this.handleChapterSkippedChange}>
              This section does not apply to this EFP.
            </sl-checkbox>
          </div>
        `;
      }
    }
    return '';
  }

  // Render lock icon with tooltip
  private renderLockIcon() {
    if (!this.workbookLocked) {
      return '';
    }

    // Determine the tooltip message based on which sign-off exists
    const workbookData = getWorkbookData();
    const YES_INT = parseInt(YES_VALUE, 10);

    let tooltipMessage = 'This workbook is locked because a Producer or Planning Advisor has signed off.';

    if (workbookData) {
      const paSigned = workbookData.quartech_pasigned === YES_INT;
      const producerSigned = workbookData.quartech_producersigned === YES_INT;

      if (paSigned && producerSigned) {
        tooltipMessage = 'This workbook is locked because both the Producer and Planning Advisor have signed off.';
      } else if (paSigned) {
        tooltipMessage = 'This workbook is locked because the Planning Advisor has signed off.';
      } else if (producerSigned) {
        tooltipMessage = 'This workbook is locked because the Producer has signed off.';
      }
    }

    return html`
      <div class="workbook-lock-indicator">
        <sl-tooltip placement="left" style="--max-width: 300px;">
          <div slot="content">${tooltipMessage}</div>
          <sl-icon
            name="lock-fill"
            class="lock-icon"
            aria-label="Workbook locked"
          ></sl-icon>
        </sl-tooltip>
      </div>
    `;
  }

  // Check if the current chapter should be marked as skipped
  private isChapterSkipped(): boolean {
    const chapterId = this.getCurrentChapterId();
    if (!chapterId) return false;

    const questions = this.getQuestionsForCurrentChapter(chapterId);
    if (questions.length === 0) return false;

    // Check if ALL questions have quartech_chapterskipped set to YES (100000000)
    return questions.every(q => {
      const entry = POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.get(q.id);
      return entry?.response?.quartech_chapterskipped === 100000000;
    });
  }

  // Check if a specific question is in a skipped chapter or if workbook is locked
  private isQuestionDisabled(questionId: string): boolean {
    // Check if workbook is locked (takes precedence)
    if (this.workbookLocked) {
      return true;
    }

    // Check if question is in a skipped chapter
    const entry = POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.get(questionId);
    return entry?.response?.quartech_chapterskipped === 100000000;
  }

  // Check if a chapter (by ID) is skipped
  private isChapterSkippedById(chapterId: string): boolean {
    if (!chapterId) return false;

    const questions = this.getQuestionsForCurrentChapter(chapterId);
    if (questions.length === 0) return false;

    // Check if ALL questions have quartech_chapterskipped set to YES (100000000)
    return questions.every(q => {
      const entry = POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.get(q.id);
      return entry?.response?.quartech_chapterskipped === 100000000;
    });
  }

  // Get the chapter ID for the current step
  private getCurrentChapterId(): string | null {
    const currentStep = this.flatSteps[this.currentStepIndex];
    if (!currentStep) return null;

    // First check if chapterId is directly on the step (for container chapters)
    if (currentStep.chapterId) {
      return currentStep.chapterId;
    }

    // For subchapters, get the chapter ID from subchapterData
    if (currentStep.subchapterData) {
      return currentStep.subchapterData.id || currentStep.subchapterData.quartech_chapterid;
    }

    // For chapters, get the chapter ID from chapterData
    if (currentStep.chapterData) {
      return currentStep.chapterData.id || currentStep.chapterData.quartech_chapterid;
    }

    return null;
  }

  // Get all questions for the current chapter (including subchapters)
  private getQuestionsForCurrentChapter(chapterId: string): any[] {
    const chapter = getChapterFromStore(chapterId);
    if (!chapter) return [];

    let questions: any[] = [...(chapter.questions || [])];

    // Also collect questions from subchapters
    if (chapter.subchapters) {
      const collectQuestionsFromSubchapters = (subchapters: any[]) => {
        for (const subchapter of subchapters) {
          questions = questions.concat(subchapter.questions || []);
          if (subchapter.subchapters) {
            collectQuestionsFromSubchapters(subchapter.subchapters);
          }
        }
      };
      collectQuestionsFromSubchapters(chapter.subchapters);
    }

    return questions;
  }

  // Handle checkbox change event
  private async handleChapterSkippedChange(event: CustomEvent) {
    const checkbox = event.target as any;
    const isChecked = checkbox.checked;

    const chapterId = this.getCurrentChapterId();
    if (!chapterId) {
      logger.warn({
        message: 'Cannot update chapter skipped: no chapter ID found',
      });
      return;
    }

    const questions = this.getQuestionsForCurrentChapter(chapterId);
    if (questions.length === 0) {
      logger.warn({
        message: 'Cannot update chapter skipped: no questions found',
        data: { chapterId },
      });
      return;
    }

    const workbookId = getWorkbookId();
    if (!workbookId) {
      logger.error({
        message: 'Cannot update chapter skipped: no workbook ID found',
      });
      return;
    }

    // Set quartech_chapterskipped to YES (100000000) if checked, NO (100000001) if unchecked
    const chapterSkippedValue = isChecked ? 100000000 : 100000001;

    logger.info({
      message: `Updating chapter skipped status for ${questions.length} questions`,
      data: { chapterId, isChecked, chapterSkippedValue, questionCount: questions.length },
    });

    // STEP 1: Optimistically update in-memory data and questionnaire store FIRST
    // This makes the UI respond instantly without waiting for API calls
    questions.forEach((question) => {
      const questionId = question.id;
      const entry = POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.get(questionId);

      if (entry?.response) {
        // Update existing response in memory
        entry.response.quartech_chapterskipped = chapterSkippedValue;
        if (isChecked) {
          entry.response.quartech_response = '';
        }
        // Update questionnaire store immediately
        updateQuestionResponse(questionId, entry.response.quartech_response, undefined, entry.response);
      } else {
        // Create a temporary response object in memory for questions without responses
        const tempResponse = {
          quartech_workbookresponseid: null, // Will be set after API call
          quartech_response: '',
          quartech_chapterskipped: chapterSkippedValue,
          _quartech_question_value: questionId,
          _quartech_workbook_value: workbookId,
        };

        // Update in-memory structure
        if (!entry) {
          POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set(questionId, {
            question: question,
            response: tempResponse,
          });
        } else {
          entry.response = tempResponse;
        }

        // Update questionnaire store immediately
        updateQuestionResponse(questionId, '', undefined, tempResponse);
      }
    });

    // STEP 2: Trigger UI update immediately (before API calls complete)
    const { updateQuestionnaireCompletion } = await import('../common/questionnaire.js');
    updateQuestionnaireCompletion();
    this.responseUpdateCounter++; // Trigger re-render for validation
    this.requestUpdate();

    logger.info({
      message: `Optimistically updated ${questions.length} questions in memory and store`,
      data: { chapterId, isChecked },
    });

    // STEP 3: Make API calls in the background (non-blocking)
    // Use Promise.allSettled to continue even if some requests fail
    const updatePromises = questions.map(async (question) => {
      const questionId = question.id;
      const entry = POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.get(questionId);

      // If response exists, update it
      if (entry?.response?.quartech_workbookresponseid) {
        const responseId = entry.response.quartech_workbookresponseid;
        try {
          await POWERPOD.fetch.patchWorkbookResponseData({
            id: responseId,
            chapterSkipped: chapterSkippedValue,
            response: isChecked ? '' : entry.response.quartech_response,
          });

          logger.info({
            message: `API: Updated response for question ${questionId}`,
            data: { questionId, responseId, chapterSkippedValue },
          });
        } catch (error) {
          logger.error({
            message: `API: Failed to update response for question ${questionId}`,
            data: { questionId, responseId, error: (error as Error).message },
          });
          throw error; // Re-throw to be caught by Promise.allSettled
        }
      } else {
        // If no response exists, create one with chapterSkipped set
        try {
          const createdResponse = await WorkbookResponseHelper.createResponse(questionId, '', {
            chapterSkipped: chapterSkippedValue,
          });

          // Update the response ID in memory now that we have it from the API
          if (createdResponse?.response && entry?.response) {
            entry.response.quartech_workbookresponseid = createdResponse.response.quartech_workbookresponseid;
          }

          logger.info({
            message: `API: Created response for question ${questionId}`,
            data: { questionId, chapterSkippedValue },
          });
        } catch (error) {
          logger.error({
            message: `API: Failed to create response for question ${questionId}`,
            data: { questionId, error: (error as Error).message },
          });
          throw error; // Re-throw to be caught by Promise.allSettled
        }
      }
    });

    // Wait for all API calls to complete (or fail)
    const results = await Promise.allSettled(updatePromises);

    // Count successes and failures
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    if (failed > 0) {
      logger.warn({
        message: `API: Completed with ${failed} failures out of ${questions.length} requests`,
        data: { chapterId, succeeded, failed, total: questions.length },
      });
    } else {
      logger.info({
        message: `API: Successfully completed all ${succeeded} requests`,
        data: { chapterId, succeeded },
      });
    }

    // Final UI update after API calls complete (in case any failed and need to be reverted)
    // Note: We already updated the UI optimistically, so this is just a safety measure
    if (failed === 0) {
      logger.info({
        message: `Successfully ${isChecked ? 'skipped' : 'unskipped'} chapter with ${questions.length} questions`,
        data: { chapterId, isChecked, questionCount: questions.length },
      });
    } else {
      // If some requests failed, we might want to show a warning to the user
      // For now, just log it - the optimistic update is already applied
      logger.warn({
        message: `Chapter ${isChecked ? 'skip' : 'unskip'} completed with errors`,
        data: { chapterId, isChecked, succeeded, failed },
      });
    }

    logger.info({
      message: 'Finished updating chapter skipped status',
      data: { chapterId, isChecked, questionCount: questions.length },
    });
  }

  private renderSubchapter(subchapter: any) {
    return html`
      ${subchapter.description
        ? html`
            <div class="subchapter-header">
              <div>${unsafeHTML(subchapter.description)}</div>
            </div>
          `
        : ''}
      ${subchapter.questions.map((question: any) =>
        this.renderQuestion(question)
      )}
      ${subchapter.subchapters
        ? subchapter.subchapters.map((subSubchapter: any) =>
            this.renderSubSubchapter(subSubchapter)
          )
        : ''}
    `;
  }

  private renderContainerSubchapter(subchapter: any) {
    return html`
      ${subchapter.description
        ? html`
            <div class="subchapter-header">
              <div>${unsafeHTML(subchapter.description)}</div>
            </div>
          `
        : ''}
    `;
  }

  private renderSubSubchapter(subSubchapter: any) {
    return html`
      ${subSubchapter.description
        ? html`
            <div class="sub-subchapter-header">
              <div>${unsafeHTML(subSubchapter.description)}</div>
            </div>
          `
        : ''}
      ${subSubchapter.questions.map((question: any) =>
        this.renderQuestion(question)
      )}
    `;
  }

  private renderChapter(chapter: any) {
    return html`
      ${chapter?.description
        ? html`
            <div class="chapter-header">
              <div>${unsafeHTML(chapter.description)}</div>
            </div>
          `
        : ''}
      ${chapter?.questions
        ? chapter.questions.map((question: any) =>
            this.renderQuestion(question)
          )
        : ''}
      ${chapter?.subchapters
        ? chapter.subchapters.map((subchapter: any) =>
            this.renderSubchapter(subchapter)
          )
        : ''}
    `;
  }

  private renderContainerChapter(chapter: any) {
    return html`
      ${chapter?.description
        ? html`
            <div class="chapter-header">
              <div>${unsafeHTML(chapter.description)}</div>
            </div>
          `
        : ''}
    `;
  }

  private renderMainContent() {
    return EFPRenderUtils.renderMainContent(
      this.currentSectionIndex,
      this.flatSteps,
      this.currentStepIndex,
      this.activeContent,
      html,
      unsafeHTML,
      (subchapterData: any) => this.renderSubchapter(subchapterData),
      (chapterData: any) => this.renderChapter(chapterData),
      (subchapterData: any) => this.renderContainerSubchapter(subchapterData),
      (chapterData: any) => this.renderContainerChapter(chapterData)
    );
  }

  // Generate Section B items directly from questionnaire store
  private getSectionBItemsFromStore(): EFPSectionItem[] {
    const questionnaire: any = getQuestionnaireFromStore();

    // If questionnaire store is not loaded, show loading state
    if (!questionnaire?.chapters?.length) {
      logger.info({
        message: '📋 Questionnaire store not loaded, showing loading state',
      });
      return [
        {
          label: 'Loading Environmental Farm Plan...',
          content: `
            <h3>Loading Environmental Farm Plan Questionnaire</h3>
            <p>Please wait while we load the questionnaire chapters and questions from the store...</p>
            <p><em>The questionnaire store is being initialized...</em></p>
          `,
          complete: false,
        },
      ];
    }

    const chapters = questionnaire.chapters[0] || [];
    const items: EFPSectionItem[] = [];

    chapters.forEach((chapter: any) => {
      // Create the main chapter container (collapsible parent)
      const chapterItem: EFPSectionItem = {
        label: EFPTextUtils.formatChapterTitle(chapter),
        title: EFPTextUtils.formatChapterTitle(chapter),
        content: EFPSectionGenerator.renderChapterContainerContent(chapter), // We now want to display the description for containers
        complete: chapter.complete || false, // Use completion from store
        isContainer: true,
        chapterId: chapter.id, // Store chapter ID for completion lookup
        items: [],
      };

      // Add all subchapters as direct clickable items under the main chapter
      if (chapter.subchapters && chapter.subchapters.length > 0) {
        chapter.subchapters.forEach((subchapter: any) => {
          // Add the subchapter as a clickable item
          const formattedSubchapterTitle =
            EFPTextUtils.formatChapterTitle(subchapter);
          const subchapterItem: EFPSectionItem = {
            label: formattedSubchapterTitle,
            content: EFPSectionGenerator.renderSubchapterContent(subchapter),
            complete: subchapter.complete || false, // Use completion from store
            chapterId: subchapter.id, // Store chapter ID for completion lookup
            subchapterData: subchapter, // Keep for backward compatibility
          };

          // If subchapter has sub-subchapters, add them as nested items
          if (subchapter.subchapters && subchapter.subchapters.length > 0) {
            subchapterItem.items = subchapter.subchapters.map(
              (subSubchapter: any) => {
                // Format sub-subchapter title
                const formattedSubSubTitle =
                  EFPTextUtils.formatChapterTitle(subSubchapter);

                return {
                  label: formattedSubSubTitle,
                  content:
                    EFPSectionGenerator.renderSubchapterContent(subSubchapter),
                  complete: subSubchapter.complete || false, // Use completion from store
                  chapterId: subSubchapter.id, // Store chapter ID for completion lookup
                  subchapterData: subSubchapter, // Keep for backward compatibility
                };
              }
            );

            // Add title property for sl-details rendering
            subchapterItem.title = subchapterItem.label;
          }

          // Always add the subchapter to the main chapter items
          chapterItem.items!.push(subchapterItem);
        });
      } else {
        // If no subchapters, add the main chapter itself as a clickable item
        const formattedTitle = EFPTextUtils.formatChapterTitle(chapter);
        chapterItem.items!.push({
          label: formattedTitle,
          content: EFPSectionGenerator.renderChapterContent(chapter),
          complete: chapter.complete || false, // Use completion from store
          chapterId: chapter.id, // Store chapter ID for completion lookup
          chapterData: chapter, // Keep for backward compatibility
        });
      }

      items.push(chapterItem);
    });

    // Add "My Action Plan" chapter from portal page data
    const myActionPlanItem = this.getMyActionPlanItemsFromPortalPage();
    items.push(myActionPlanItem);

    return items;
  }

  // Generate My Action Plan items from portal page data
  private getMyActionPlanItemsFromPortalPage(): EFPSectionItem {
    const portalPageName = 'My Action Plan';
    const portalPageData = POWERPOD.state?.portalPages?.[portalPageName];

    // If portal page data is not loaded yet, return loading state
    if (!portalPageData) {
      logger.info({
        message: '📄 My Action Plan portal page data not loaded yet, showing loading state',
      });
      return {
        label: 'My Action Plan',
        title: 'My Action Plan',
        content: `
          <div style="display: flex; justify-content: center; align-items: center; min-height: 300px;">
            <div id="spinner"></div>
          </div>
        `,
        complete: false,
        isContainer: true,
        disableExpand: true,
        hideSkipChapterCheckbox: true,
        items: [
          {
            label: 'My Action Plan',
            content: `
              <div style="display: flex; justify-content: center; align-items: center; min-height: 300px;">
                <div id="spinner"></div>
              </div>
            `,
            complete: false,
            hideSkipChapterCheckbox: true,
          }
        ],
      };
    }

    // Build the content from sections 1-6
    const sections = [
      portalPageData.quartech_section1,
      portalPageData.quartech_section2,
      portalPageData.quartech_section3,
      portalPageData.quartech_section4,
      portalPageData.quartech_section5,
      portalPageData.quartech_section6,
    ].filter((section) => section); // Filter out null/undefined sections

    // Clean up the HTML content to remove problematic font-family styles
    const cleanedSections = sections.map((section) => {
      if (!section) return section;
      // Replace Roboto Slab font-family with BC Sans
      let cleaned = section.replace(
        /font-family:\s*&quot;Roboto Slab&quot;[^;]*;/gi,
        ''
      );
      cleaned = cleaned.replace(/font-family:\s*"Roboto Slab"[^;]*;/gi, '');
      cleaned = cleaned.replace(/font-family:\s*'Roboto Slab'[^;]*;/gi, '');
      // Also replace list-style-position: inside with outside
      cleaned = cleaned.replace(
        /list-style-position:\s*inside/gi,
        'list-style-position: outside'
      );
      return cleaned;
    });

    const actionPlanContent = `
      <div style="font-family: 'BC Sans', 'Noto Sans', Verdana, sans-serif !important;">
        <style>
          .action-plan-content * {
            font-family: 'BC Sans', 'Noto Sans', Verdana, sans-serif !important;
          }
          .action-plan-content ul {
            list-style-position: outside !important;
            padding-left: 2em !important;
            margin: 1em 0 !important;
          }
          .action-plan-content ol {
            list-style-position: outside !important;
            padding-left: 2em !important;
            margin: 1em 0 !important;
          }
          .action-plan-content li {
            display: list-item !important;
            padding-left: 0.5em !important;
            line-height: 1.6 !important;
          }
          .action-plan-content h1, .action-plan-content h2, .action-plan-content h3,
          .action-plan-content h4, .action-plan-content h5, .action-plan-content h6 {
            font-family: 'BC Sans', 'Noto Sans', Verdana, sans-serif !important;
          }
          .action-plan-content p {
            font-family: 'BC Sans', 'Noto Sans', Verdana, sans-serif !important;
          }
        </style>
        <div class="action-plan-content">
          ${cleanedSections.join('\n')}
        </div>
        <action-plan-table></action-plan-table>
      </div>
    `;

    return {
      label: 'My Action Plan',
      title: 'My Action Plan',
      content: actionPlanContent,
      complete: false,
      isContainer: true,
      disableExpand: true,
      hideSkipChapterCheckbox: true,
      items: [
        {
          label: 'My Action Plan',
          content: actionPlanContent,
          complete: false,
          hideSkipChapterCheckbox: true,
        }
      ],
    };
  }

  // Generate Section C items from portal page data
  private getSectionCItemsFromPortalPage(): EFPSectionItem[] {
    const portalPageName = 'Workbook Terms and Conditions Sign-off';
    const portalPageData = POWERPOD.state?.portalPages?.[portalPageName];

    // If portal page data is not loaded yet, return loading state
    if (!portalPageData) {
      logger.info({
        message: '📄 Portal page data not loaded yet, showing loading state',
      });
      return [
        {
          label: '',
          content: `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 300px;">
              <div id="spinner"></div>
            </div>
          `,
          complete: false,
        },
      ];
    }

    // Build the terms and conditions content from sections 1-6
    const sections = [
      portalPageData.quartech_section1,
      portalPageData.quartech_section2,
      portalPageData.quartech_section3,
      portalPageData.quartech_section4,
      portalPageData.quartech_section5,
      portalPageData.quartech_section6,
    ].filter((section) => section); // Filter out null/undefined sections

    // Clean up the HTML content to remove problematic font-family styles
    const cleanedSections = sections.map((section) => {
      if (!section) return section;
      // Replace Roboto Slab font-family with BC Sans
      let cleaned = section.replace(
        /font-family:\s*&quot;Roboto Slab&quot;[^;]*;/gi,
        ''
      );
      cleaned = cleaned.replace(/font-family:\s*"Roboto Slab"[^;]*;/gi, '');
      cleaned = cleaned.replace(/font-family:\s*'Roboto Slab'[^;]*;/gi, '');
      // Also replace list-style-position: inside with outside
      cleaned = cleaned.replace(
        /list-style-position:\s*inside/gi,
        'list-style-position: outside'
      );
      return cleaned;
    });

    const termsContent = `
      <div style="font-family: 'BC Sans', 'Noto Sans', Verdana, sans-serif !important;">
        <style>
          .terms-content * {
            font-family: 'BC Sans', 'Noto Sans', Verdana, sans-serif !important;
          }
          .terms-content ul {
            list-style-position: outside !important;
            padding-left: 2em !important;
            margin: 1em 0 !important;
          }
          .terms-content ol {
            list-style-position: outside !important;
            padding-left: 2em !important;
            margin: 1em 0 !important;
          }
          .terms-content li {
            display: list-item !important;
            padding-left: 0.5em !important;
            line-height: 1.6 !important;
          }
          .terms-content h1, .terms-content h2, .terms-content h3,
          .terms-content h4, .terms-content h5, .terms-content h6 {
            font-family: 'BC Sans', 'Noto Sans', Verdana, sans-serif !important;
          }
          .terms-content p {
            font-family: 'BC Sans', 'Noto Sans', Verdana, sans-serif !important;
          }
        </style>
        <div class="terms-content">
          <h3>Environmental Farm Plan Terms & Conditions</h3>
          <p>Please read the following terms and conditions carefully before proceeding with your Environmental Farm Plan submission.</p>
          ${cleanedSections.join('\n')}
        </div>
        <workbook-sign-off-buttons></workbook-sign-off-buttons>
      </div>
    `;

    return [
      {
        label: 'Terms & Conditions',
        content: termsContent,
        complete: false,
      },
    ];
  }

  // Get completion status from questionnaire store for navigation items
  private getCompletionFromStore(item: any): boolean {
    if (!isQuestionnaireLoaded()) {
      // Fallback to item's current complete status

      return item.complete || false;
    }

    try {
      // Check if this is a chapter item (new chapterId property from store)
      if (item.chapterId) {
        const chapter = getChapterFromStore(item.chapterId);
        const storeComplete = chapter?.complete || false;

        return storeComplete;
      }

      // Check if this is a question item
      if (item.questionId) {
        const question = getQuestionFromStore(item.questionId);
        const storeComplete = question?.complete || false;

        return storeComplete;
      }

      // For nested items (containers), check children completion
      if ('items' in item && Array.isArray(item.items)) {
        // All child items must be complete for parent to be complete
        const childrenComplete = item.items.every((child: any) =>
          this.getCompletionFromStore(child)
        );

        return childrenComplete;
      }

      // Fallback to item's current status

      return item.complete || false;
    } catch (error) {
      logger.warn({
        message: `Failed to get completion from questionnaire store: ${String(
          error
        )}`,
      });
      return item.complete || false;
    }
  }

  // Get section completion status from questionnaire store
  private getSectionCompletionFromStore(section: any): boolean {
    // For My Workbook, use questionnaire store completion
    if (section.tab === 'My Workbook' && isQuestionnaireLoaded()) {
      try {
        // Import questionnaire stats dynamically to avoid circular imports
        const questionnaire = getQuestionnaireFromStore();
        if (questionnaire) {
          // Calculate completion based on questionnaire store data
          let totalQuestions = 0;
          let answeredQuestions = 0;

          const countInChapters = (chapters: any[]) => {
            chapters.forEach((chapter: any) => {
              if (chapter.questions) {
                totalQuestions += chapter.questions.length;
                answeredQuestions += chapter.questions.filter(
                  (q: any) => q.complete
                ).length;
              }
              if (chapter.subchapters) {
                countInChapters(chapter.subchapters);
              }
            });
          };

          if (questionnaire.chapters && questionnaire.chapters.length > 0) {
            countInChapters(questionnaire.chapters[0]);
          }

          // Section is complete if all questions are answered
          return totalQuestions > 0 && answeredQuestions === totalQuestions;
        }
      } catch (error) {
        logger.warn({
          message: `Failed to get section completion from questionnaire store: ${String(
            error
          )}`,
        });
      }
    }

    // Fallback to existing logic
    return EFPCompletionUtils.isSectionComplete(section);
  }

  // Get section skipped status from questionnaire store
  private getSectionSkippedFromStore(section: any): boolean {
    // Only check for My Workbook section
    if (section.tab !== 'My Workbook') {
      return false;
    }

    if (!POWERPOD.workbookQuestionsAndResponses.isLoaded) {
      return false;
    }

    try {
      const questionnaire = getQuestionnaireFromStore();
      if (!questionnaire) {
        return false;
      }

      // Check if ALL questions in the section are skipped
      let totalQuestions = 0;
      let skippedQuestions = 0;

      const countInChapters = (chapters: any[]) => {
        chapters.forEach((chapter: any) => {
          if (chapter.questions) {
            chapter.questions.forEach((question: any) => {
              totalQuestions++;
              const entry = POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.get(question.id);
              if (entry?.response?.quartech_chapterskipped === 100000000) {
                skippedQuestions++;
              }
            });
          }
          if (chapter.subchapters) {
            countInChapters(chapter.subchapters);
          }
        });
      };

      if (questionnaire.chapters && questionnaire.chapters.length > 0) {
        countInChapters(questionnaire.chapters[0]);
      }

      // Section is skipped if all questions are skipped
      return totalQuestions > 0 && skippedQuestions === totalQuestions;
    } catch (error) {
      logger.warn({
        message: `Failed to get section skipped status: ${String(error)}`,
      });
      return false;
    }
  }

  // Public API methods
  public updateNestedChapterStructure(nestedStructure: any[]) {
    logger.info({
      message: `updateNestedChapterStructure called with ${
        nestedStructure?.length || 0
      } chapters`,
    });

    this.nestedChapterStructure = nestedStructure;

    // Also update the questionnaire store if not already loaded
    if (!isQuestionnaireLoaded()) {
      logger.info({
        message:
          'Loading questionnaire data into store from updateNestedChapterStructure',
      });
      // Import the loadQuestionnaireIntoStore function dynamically to avoid circular imports
      import('../common/questionnaire.js').then(
        ({ loadQuestionnaireIntoStore }) => {
          loadQuestionnaireIntoStore(nestedStructure);
        }
      );
    }

    // The @property decorator will automatically trigger a re-render
    // But we can force it to be sure
    this.requestUpdate();
  }

  // Computed properties
  private get completionPercent(): number {
    // Use questionnaire store completion if available (preferred method)
    if (isQuestionnaireLoaded()) {
      try {
        // Get stats synchronously from questionnaire store
        const questionnaire = getQuestionnaireFromStore();
        if (questionnaire) {
          // Calculate completion percentage from questionnaire store
          let totalQuestions = 0;
          let answeredQuestions = 0;

          const countInChapters = (chapters: any[]) => {
            chapters.forEach((chapter: any) => {
              if (chapter.questions) {
                totalQuestions += chapter.questions.length;
                answeredQuestions += chapter.questions.filter(
                  (q: any) => q.complete
                ).length;
              }
              if (chapter.subchapters) {
                countInChapters(chapter.subchapters);
              }
            });
          };

          if (questionnaire.chapters && questionnaire.chapters.length > 0) {
            countInChapters(questionnaire.chapters[0]);
          }

          return totalQuestions > 0
            ? Math.round((answeredQuestions / totalQuestions) * 100)
            : 0;
        }
      } catch (error) {
        logger.warn({
          message:
            'Failed to get completion from questionnaire store, falling back',
        });
      }
    }

    // Use workbook responses completion if available, otherwise fall back to static completion
    if (POWERPOD.workbookQuestionsAndResponses.isLoaded) {
      return POWERPOD.workbookQuestionsAndResponses.stats.completionPercentage;
    }
    return EFPCompletionUtils.calculateOverallCompletion(this.sections);
  }

  // Navigation methods
  private goToNext() {
    logger.info({
      message: `goToNext called, current step: ${this.currentStepIndex}, ${
        this.flatSteps[this.currentStepIndex]?.label
      }`,
    });

    // Handle case where currentStepIndex is -1 (step not found in flatSteps)
    if (this.currentStepIndex === -1) {
      logger.warn({
        message:
          'currentStepIndex is -1, trying to find current step by activeContent title',
      });
      const foundIndex = this.flatSteps.findIndex(
        (step) => step.label === this.activeContent.title
      );
      if (foundIndex !== -1) {
        logger.info({
          message: `Found current step "${this.activeContent.title}" at index ${foundIndex}`,
        });
        this.currentStepIndex = foundIndex;
      } else {
        logger.error({
          message: `Could not find current step "${this.activeContent.title}" in flatSteps`,
        });
        return; // Don't proceed with navigation if we can't find current position
      }
    }

    const nextIndex = EFPNavigationUtils.findNextSelectableStep(
      this.currentStepIndex,
      this.flatSteps,
      this.sections
    );
    if (nextIndex != null) {
      const nextStep = this.flatSteps[nextIndex];

      // Block navigation to "Review & Submit" section if there are incomplete questions
      if (nextStep.sectionIndex === 1 && !this.canAccessReviewAndSubmit()) {
        this.showIncompleteQuestionsAlert();
        logger.info({
          message: 'Prevented navigation to Review & Submit - incomplete questions',
        });
        return;
      }

      // Check if next step has the same label and content as current step
      // This can happen with duplicate entries like "My Action Plan"
      const currentStep = this.flatSteps[this.currentStepIndex];
      const isSameContent = currentStep &&
        currentStep.label === nextStep.label &&
        currentStep.content === nextStep.content;

      if (isSameContent) {
        logger.info({
          message: `Skipping duplicate step "${nextStep.label}" at index ${nextIndex}, continuing to next`,
        });

        // Skip this duplicate and go to the next step
        const nextNextIndex = EFPNavigationUtils.findNextSelectableStep(
          nextIndex,
          this.flatSteps,
          this.sections
        );

        if (nextNextIndex != null) {
          const nextNextStep = this.flatSteps[nextNextIndex];

          // Block navigation to "Review & Submit" section if there are incomplete questions
          if (nextNextStep.sectionIndex === 1 && !this.canAccessReviewAndSubmit()) {
            this.showIncompleteQuestionsAlert();
            logger.info({
              message: 'Prevented navigation to Review & Submit - incomplete questions',
            });
            return;
          }

          this.isNavigating = true;
          this.currentStepIndex = nextNextIndex;
          this.currentSectionIndex = nextNextStep.sectionIndex;
          this.activeContent = { title: nextNextStep.label, content: nextNextStep.content };
          this.updateNavigationState(nextNextStep.label);

          // Scroll to top of main content to provide visual feedback
          this.updateComplete.then(() => {
            const mainContent = this.shadowRoot?.querySelector('main.main-content');
            if (mainContent) {
              mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          });

          setTimeout(() => {
            this.isNavigating = false;
          }, 100);
          this.requestUpdate();
        }
        return;
      }

      this.isNavigating = true;
      this.currentStepIndex = nextIndex;
      this.currentSectionIndex = nextStep.sectionIndex;
      this.activeContent = { title: nextStep.label, content: nextStep.content };
      this.updateNavigationState(nextStep.label);

      // Scroll to top of main content to provide visual feedback
      this.updateComplete.then(() => {
        const mainContent = this.shadowRoot?.querySelector('main.main-content');
        if (mainContent) {
          mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });

      setTimeout(() => {
        this.isNavigating = false;
      }, 100);
      this.requestUpdate();
    }
  }

  // Find the next required step (earliest unanswered, non-skipped question)
  private findNextRequiredStep(): { stepIndex: number; questionId: string } | null {
    if (!POWERPOD.workbookQuestionsAndResponses.isLoaded) {
      logger.warn({
        message: 'Cannot find next required step: workbook questions and responses not loaded',
      });
      return null;
    }

    const questionnaire = getQuestionnaireFromStore();
    if (!questionnaire?.chapters?.length) {
      logger.warn({
        message: 'Cannot find next required step: questionnaire not loaded',
      });
      return null;
    }

    // Start searching from the beginning to find the earliest required question
    const startIndex = 0;

    // Iterate through all steps in the My Workbook section (section index 0)
    for (let i = startIndex; i < this.flatSteps.length; i++) {
      const step = this.flatSteps[i];

      // Only check steps in My Workbook section
      if (step.sectionIndex !== 0) {
        continue;
      }

      // Skip container steps
      if (step.isContainer || step.label.startsWith('Section ')) {
        continue;
      }

      // Get the chapter ID for this step
      const chapterId = step.chapterId ||
                       step.chapterData?.id ||
                       step.subchapterData?.id;

      if (!chapterId) {
        continue;
      }

      // Get all questions for this chapter
      const questions = this.getQuestionsForCurrentChapter(chapterId);

      // Find the first unanswered, non-skipped question in this chapter
      const firstUnansweredQuestion = questions.find((question: any) => {
        const entry = POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.get(question.id);
        const isSkipped = entry?.response?.quartech_chapterskipped === 100000000;
        const hasResponse = entry?.response?.quartech_response &&
                           entry.response.quartech_response.trim() !== '';

        // Question is required and unanswered if it's not skipped AND has no response
        return !isSkipped && !hasResponse;
      });

      if (firstUnansweredQuestion) {
        logger.info({
          message: 'Found next required step with unanswered questions',
          data: {
            stepIndex: i,
            stepLabel: step.label,
            chapterId,
            questionId: firstUnansweredQuestion.id,
          },
        });
        return { stepIndex: i, questionId: firstUnansweredQuestion.id };
      }
    }

    logger.info({
      message: 'No required unanswered questions found after current step',
    });
    return null;
  }

  // Navigation event handlers
  private handleNavigationPrevious() {
    this.goToPrevious();
  }

  private handleNavigationSkip(event: CustomEvent) {
    // Find the next required question that hasn't been skipped or completed
    const result = this.findNextRequiredStep();

    if (result !== null) {
      const { stepIndex, questionId } = result;
      const nextStep = this.flatSteps[stepIndex];

      logger.info({
        message: 'Navigating to next required step',
        data: {
          stepIndex,
          stepLabel: nextStep.label,
          questionId,
        },
      });

      this.isNavigating = true;
      this.currentStepIndex = stepIndex;
      this.currentSectionIndex = nextStep.sectionIndex;
      this.activeContent = { title: nextStep.label, content: nextStep.content };
      this.updateNavigationState(nextStep.label);

      // Scroll to and highlight the specific question
      this.updateComplete.then(() => {
        // Small delay to ensure DOM is fully rendered
        setTimeout(() => {
          const questionElement = this.shadowRoot?.querySelector(
            `[data-question-id="${questionId}"]`
          ) as HTMLElement;

          if (questionElement) {
            // Add highlight class
            questionElement.classList.add('question-highlight');

            // Scroll to the question with some offset for better visibility
            questionElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });

            // Remove highlight after 3 seconds
            setTimeout(() => {
              questionElement.classList.remove('question-highlight');
            }, 3000);

            logger.info({
              message: 'Scrolled to and highlighted question',
              data: { questionId },
            });
          } else {
            logger.warn({
              message: 'Could not find question element to scroll to',
              data: { questionId },
            });
          }
        }, 200);
      });

      setTimeout(() => {
        this.isNavigating = false;
      }, 100);
      this.requestUpdate();
    } else {
      logger.info({
        message: 'No required unanswered questions found',
      });
    }
  }

  private handleNavigationContinue() {
    // goToNext handles all validation including Review & Submit blocking
    this.goToNext();
  }

  // Compute if Continue button should be disabled - only at the very last step
  private get isContinueButtonDisabled(): boolean {
    // Only disable at the last step
    return this.currentStepIndex >= this.flatSteps.length - 1;
  }

  // Section navigation event handler
  private handleSectionChange(newSectionIndex: number) {
    // Check if trying to navigate to "Review & Submit" (section index 1)
    if (newSectionIndex === 1 && !this.canAccessReviewAndSubmit()) {
      // Prevent navigation and show alert
      this.showIncompleteQuestionsAlert();

      // Stay on current section by resetting the tab
      setTimeout(() => {
        const tabGroup = this.shadowRoot?.querySelector('sl-tab-group') as any;
        if (tabGroup) {
          tabGroup.show(`section-${this.currentSectionIndex}`);
        }
      }, 0);

      return;
    }

    EFPEventUtils.handleSectionChange(
      newSectionIndex,
      this.isNavigating,
      this.flatSteps,
      (stepIndex: number, sectionIndex: number) => {
        this.currentStepIndex = stepIndex;
        this.currentSectionIndex = sectionIndex;

        // Update the active content
        const step = this.flatSteps[stepIndex];
        if (step) {
          this.activeContent = {
            title: step.label,
            content: step.content,
          };
        }

        // Force a re-render
        this.requestUpdate();
      },
      (label: string) => this.updateNavigationState(label)
    );
  }

  // Question interaction event handler
  private handleRatingChanged(event: CustomEvent) {
    const { questionId, value } = event.detail;

    try {
      logger.info({
        message: `Rating changed for question ${questionId}: ${value}`,
      });

      // Store the pending value
      this.pendingResponseValues.set(questionId, String(value));

      // Clear any existing debounce timer for this question
      const existingTimer = this.responseSaveDebounceTimers.get(questionId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set a new debounce timer (1000ms delay)
      const timer = window.setTimeout(() => {
        this.saveDebouncedResponse(questionId);
      }, 1000);

      this.responseSaveDebounceTimers.set(questionId, timer);

      // Also call the original handler for any additional processing
      EFPEventUtils.handleRatingChanged(
        event,
        (questionId: string, value: any) => {
          logger.info({
            message: `Rating stored in memory for question ${questionId}: ${value}`,
          });
        }
      );
    } catch (error) {
      logger.error({
        message: `Failed to save rating response: ${(error as Error).message}`,
      });

      // Still call the original handler even if save fails
      EFPEventUtils.handleRatingChanged(
        event,
        (questionId: string, value: any) => {
          logger.info({
            message: `Rating stored locally for question ${questionId}: ${value} (save failed)`,
          });
        }
      );
    }
  }

  // Multi-select list interaction event handler
  private handleMultiselectChange(
    questionId: string,
    option: string,
    isChecked: boolean
  ) {
    try {
      logger.info({
        message: `Multi-select option changed for question ${questionId}: ${option} = ${isChecked}`,
      });

      // Get the valid options for this question
      const question = getQuestionFromStore(questionId);
      const optionsString = question?.multiselectOptions || '';
      const validOptions = optionsString
        .split(';')
        .map((opt: string) => opt.trim())
        .filter((opt: string) => opt.length > 0);

      // Get current pending value or existing response
      let selectedOptions: string[];
      if (this.pendingMultiselectValues.has(questionId)) {
        // Use pending value if it exists
        selectedOptions = this.pendingMultiselectValues.get(questionId)!;
      } else {
        // Start with an empty array and only add valid options from existing response
        const existingResponse = this.getResponseForQuestion(questionId);
        const currentSelectedString = existingResponse?.quartech_response || '';
        const existingSelectedOptions = currentSelectedString
          .split(';')
          .map((opt: string) => opt.trim())
          .filter((opt: string) => opt.length > 0);

        // Filter to only include options that are valid for the current question
        selectedOptions = existingSelectedOptions.filter((opt: string) =>
          validOptions.includes(opt)
        );

        logger.info({
          message: `Filtered existing response for question ${questionId}`,
          data: {
            existingOptions: existingSelectedOptions,
            validOptions: validOptions,
            filteredOptions: selectedOptions,
          },
        });
      }

      // Update the selected options based on checkbox state
      if (isChecked) {
        // Add option if not already present
        if (!selectedOptions.includes(option)) {
          selectedOptions.push(option);
        }
      } else {
        // Remove option
        selectedOptions = selectedOptions.filter(
          (opt: string) => opt !== option
        );
      }

      // Store the pending value
      this.pendingMultiselectValues.set(questionId, selectedOptions);

      // Clear any existing debounce timer for this question
      const existingTimer = this.responseSaveDebounceTimers.get(questionId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set a new debounce timer (2000ms delay)
      const timer = window.setTimeout(() => {
        this.saveMultiselectResponse(questionId);
      }, 2000);

      this.responseSaveDebounceTimers.set(questionId, timer);
    } catch (error) {
      logger.error({
        message: `Failed to handle multi-select change: ${
          (error as Error).message
        }`,
      });
    }
  }

  // Save the debounced response (for rating questions and other text-based responses)
  private async saveDebouncedResponse(questionId: string) {
    try {
      const responseValue = this.pendingResponseValues.get(questionId);
      if (responseValue === undefined) {
        logger.warn({
          message: `No pending value found for question ${questionId}`,
        });
        return;
      }

      logger.info({
        message: `Saving debounced response for question ${questionId}: ${responseValue}`,
      });

      // Save the response
      const responseData = await this.saveRatingResponse(
        questionId,
        responseValue
      );

      // Update the questionnaire store with the full response data
      // Let updateQuestionResponse auto-calculate completion based on response content
      updateQuestionResponse(questionId, responseValue, undefined, responseData);
      this.responseUpdateCounter++; // Trigger re-render for validation
      this.requestUpdate(); // Force immediate UI update

      logger.info({
        message: `Successfully saved debounced response for question ${questionId}`,
      });

      // Clean up
      this.pendingResponseValues.delete(questionId);
      this.responseSaveDebounceTimers.delete(questionId);
    } catch (error) {
      logger.error({
        message: `Failed to save debounced response: ${
          (error as Error).message
        }`,
      });
      // Don't delete pending value on error, so user can retry
    }
  }

  // Save the debounced multi-select response
  private async saveMultiselectResponse(questionId: string) {
    try {
      const selectedOptions = this.pendingMultiselectValues.get(questionId);
      if (!selectedOptions) {
        logger.warn({
          message: `No pending value found for question ${questionId}`,
        });
        return;
      }

      // Create semicolon-delimited string
      const newValue = selectedOptions.join(';');

      logger.info({
        message: `Saving multi-select value for question ${questionId}: ${newValue}`,
      });

      // Save the response
      const responseData = await this.saveRatingResponse(questionId, newValue);

      // Update the questionnaire store with the full response data
      // Let updateQuestionResponse auto-calculate completion based on response content
      updateQuestionResponse(questionId, newValue, undefined, responseData);
      this.responseUpdateCounter++; // Trigger re-render for validation
      this.requestUpdate(); // Force immediate UI update

      logger.info({
        message: `Successfully saved multi-select response for question ${questionId}`,
      });

      // Clean up
      this.pendingMultiselectValues.delete(questionId);
      this.responseSaveDebounceTimers.delete(questionId);
    } catch (error) {
      logger.error({
        message: `Failed to save multi-select response: ${
          (error as Error).message
        }`,
      });
      // Don't delete pending value on error, so user can retry
    }
  }

  // Handle multiline text input with debounced save
  private handleMultilineTextInput(questionId: string, value: string) {
    try {
      logger.info({
        message: `Multiline text input for question ${questionId}`,
      });

      // Update character count immediately (no debounce)
      this.multilineTextCharCounts.set(questionId, value.length);

      // Store the pending value
      this.pendingResponseValues.set(questionId, value);

      // Update status to draft
      this.multilineTextSaveStatus.set(questionId, 'draft');

      // Request update to re-render with new character count
      this.requestUpdate();

      // Clear any existing debounce timer for this question
      const existingTimer = this.responseSaveDebounceTimers.get(questionId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set a new debounce timer (2000ms delay)
      const timer = window.setTimeout(() => {
        this.saveMultilineTextResponse(questionId);
      }, 2000);

      this.responseSaveDebounceTimers.set(questionId, timer);
    } catch (error) {
      logger.error({
        message: `Failed to handle multiline text input: ${
          (error as Error).message
        }`,
      });
    }
  }

  // Force save multiline text (when user clicks the status indicator)
  private async handleForceSave(questionId: string) {
    try {
      const status = this.multilineTextSaveStatus.get(questionId);

      // Only allow force save if status is 'draft'
      if (status !== 'draft') {
        return;
      }

      logger.info({
        message: `Force saving multiline text for question ${questionId}`,
      });

      // Clear any existing debounce timer
      const existingTimer = this.responseSaveDebounceTimers.get(questionId);
      if (existingTimer) {
        clearTimeout(existingTimer);
        this.responseSaveDebounceTimers.delete(questionId);
      }

      // Save immediately
      await this.saveMultilineTextResponse(questionId);
    } catch (error) {
      logger.error({
        message: `Failed to force save multiline text: ${
          (error as Error).message
        }`,
      });
    }
  }

  // Save the multiline text response
  private async saveMultilineTextResponse(questionId: string) {
    try {
      const responseValue = this.pendingResponseValues.get(questionId);
      if (responseValue === undefined) {
        logger.warn({
          message: `No pending value found for question ${questionId}`,
        });
        return;
      }

      logger.info({
        message: `Saving multiline text response for question ${questionId}`,
      });

      // Update status to saving
      this.multilineTextSaveStatus.set(questionId, 'saving');
      this.requestUpdate();

      // Save the response
      const responseData = await this.saveRatingResponse(
        questionId,
        responseValue
      );

      // Update the questionnaire store with the full response data
      updateQuestionResponse(questionId, responseValue, true, responseData);
      this.responseUpdateCounter++; // Trigger re-render for validation
      this.requestUpdate(); // Force immediate UI update

      logger.info({
        message: `Successfully saved multiline text response for question ${questionId}`,
      });

      // Update status to saved
      this.multilineTextSaveStatus.set(questionId, 'saved');
      this.requestUpdate();

      // Clean up
      this.pendingResponseValues.delete(questionId);
      this.responseSaveDebounceTimers.delete(questionId);
    } catch (error) {
      logger.error({
        message: `Failed to save multiline text response: ${
          (error as Error).message
        }`,
      });
      // Revert status to draft on error
      this.multilineTextSaveStatus.set(questionId, 'draft');
      this.requestUpdate();
      // Don't delete pending value on error, so user can retry
    }
  }

  // Helper method to build rating description for Point Rating questions
  private buildRatingDescription(
    questionId: string,
    ratingValue: any
  ): string | null {
    // Only build description for Point Rating questions with numeric values (1-4)
    const ratingNum = parseInt(String(ratingValue));
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 4) {
      return null;
    }

    // Get question data from memory
    const questionData = this.getQuestionForQuestion(questionId);
    if (!questionData) {
      return null;
    }

    // Check if this is a Point Rating question
    if (questionData.quartech_questiontype !== 100000001) {
      // 100000001 is Point Rating
      return null;
    }

    // Get the rating label and description
    const labelKey = `quartech_rating${ratingNum}overwritelabel`;
    const descKey = `quartech_rating${ratingNum}description`;

    const label = questionData[labelKey] || `Risk Rating ${ratingNum}`;
    const description = questionData[descKey];

    // Only build description if there's a description field
    if (!description) {
      return null;
    }

    // Strip HTML tags from description to get plain text
    const plainDescription = description.replace(/<[^>]*>/g, '').trim();

    // Build the description in the format: "Rating Label: Description"
    return `${label}: ${plainDescription}`;
  }

  // Helper method to save rating responses
  private async saveRatingResponse(
    questionId: string,
    ratingValue: any
  ): Promise<any> {
    try {
      const responseText = String(ratingValue);
      const notes = `Rating: ${ratingValue}`;

      // Build description for Point Rating questions with descriptions
      const description = this.buildRatingDescription(questionId, ratingValue);

      // Check if response already exists
      const existingResponse = this.getResponseForQuestion(questionId);

      let responseData;
      let isNewResponse = false;

      // Only update if we have an existing response WITH a valid ID
      if (existingResponse && existingResponse.quartech_workbookresponseid) {
        // Update existing response

        await WorkbookResponseHelper.updateResponse(
          existingResponse.quartech_workbookresponseid,
          responseText,
          { notes, description }
        );

        // Create updated response data
        responseData = {
          ...existingResponse,
          quartech_response: responseText,
          quartech_notes: notes,
          quartech_description: description,
          modifiedon: new Date().toISOString(),
        };
      } else {
        // Create new response (either no response exists, or existing response lacks valid ID)
        isNewResponse = true;

        const createResult = (await WorkbookResponseHelper.createResponse(
          questionId,
          responseText,
          { notes, description }
        )) as any;

        const workbookId = getWorkbookId();

        // Create new response data with all fields from the API response
        responseData = {
          ...createResult.response,
          quartech_workbookresponseid:
            createResult.response?.quartech_workbookresponseid,
          quartech_response: responseText,
          quartech_notes: notes,
          quartech_description: description,
          _quartech_question_value: questionId,
          _quartech_workbook_value: workbookId,
          createdon:
            createResult.response?.createdon || new Date().toISOString(),
          modifiedon:
            createResult.response?.modifiedon || new Date().toISOString(),
        };

        // CRITICAL: Update memory structures IMMEDIATELY after creation
        // This ensures subsequent rapid saves will find the response and update instead of creating duplicates
        this.updateMemoryStructuresForRating(questionId, responseData, true);
      }

      // Update memory structures for updates (for creates, already done above)
      if (!isNewResponse) {
        this.updateMemoryStructuresForRating(questionId, responseData, false);
      }

      // Update completion and navigation icons
      this.updateCompletionAndNavigation();

      // Trigger re-render (already called by updateCompletionAndNavigation, but keeping for clarity)
      this.requestUpdate();

      // Return the response data for use in questionnaire store
      return responseData;
    } catch (error) {
      logger.error({
        message: `Failed to save rating response: ${String(error)}`,
      });
      throw error;
    }
  }

  // Update memory structures for rating responses
  private async updateMemoryStructuresForRating(
    questionId: string,
    responseData: any,
    isNewResponse: boolean
  ) {
    try {
      // Update new nested structure using helper function
      WorkbookResponseHelper.updateResponseInMemory(questionId, responseData);

      // Update old structure for backward compatibility
      POWERPOD.workbookResponses.responsesByQuestion.set(
        questionId,
        responseData
      );

      if (isNewResponse) {
        // Add to beginning of data array (most recent first)
        POWERPOD.workbookResponses.data.unshift(responseData);
      } else {
        // Update existing entry in data array
        const dataIndex = POWERPOD.workbookResponses.data.findIndex(
          (r: any) =>
            r.quartech_workbookresponseid ===
            responseData.quartech_workbookresponseid
        );
        if (dataIndex !== -1) {
          POWERPOD.workbookResponses.data[dataIndex] = responseData;
        }
      }

      // Update memory metadata for both structures
      POWERPOD.workbookResponses.lastUpdated = new Date().toISOString();
      POWERPOD.workbookQuestionsAndResponses.lastUpdated =
        new Date().toISOString();
    } catch (error) {
      logger.error({
        message: `Failed to update memory structures for rating: ${String(
          error
        )}`,
      });
      // Don't throw - this is a memory update issue, not a save issue
    }
  }

  // Navigation item click event handler
  private handleItemClick(item: EFPSectionItem) {
    EFPEventUtils.handleItemClick(
      item,
      this.flatSteps,
      (stepIndex: number, sectionIndex: number) => {
        this.currentStepIndex = stepIndex;
        this.currentSectionIndex = sectionIndex;
      },
      (label: string) => this.updateNavigationState(label)
    );
  }

  // Utility methods
  private updateNavigationState(currentLabel: string) {
    // Find all sl-details elements in the navigation
    const allDetails = this.shadowRoot?.querySelectorAll('sl-details');
    if (!allDetails) return;

    // First, close all details
    allDetails.forEach((detail) => {
      detail.open = false;
    });

    // Find which containers should be open based on the current item
    const containersToOpen = EFPNavigationUtils.findContainersForItem(
      currentLabel,
      this.sections
    );

    // Open the relevant containers
    allDetails.forEach((detail) => {
      // Check data attribute first (most reliable), then fallback to other methods
      const containerTitle = detail.getAttribute('data-container-title');
      const summary = detail.getAttribute('summary');
      const customSummarySpan = detail.querySelector('[slot="summary"] span');
      const summaryText =
        containerTitle ||
        summary ||
        (customSummarySpan ? customSummarySpan.textContent : null);

      if (summaryText && containersToOpen.includes(summaryText)) {
        detail.open = true;
      }
    });
  }

  private goToPrevious() {
    logger.info({
      message: `goToPrevious called, current step: ${this.currentStepIndex}, ${
        this.flatSteps[this.currentStepIndex]?.label
      }`,
    });

    // Handle case where currentStepIndex is -1 (step not found in flatSteps)
    if (this.currentStepIndex === -1) {
      logger.warn({
        message:
          'currentStepIndex is -1, trying to find current step by activeContent title',
      });
      const foundIndex = this.flatSteps.findIndex(
        (step) => step.label === this.activeContent.title
      );
      if (foundIndex !== -1) {
        logger.info({
          message: `Found current step "${this.activeContent.title}" at index ${foundIndex}`,
        });
        this.currentStepIndex = foundIndex;
      } else {
        logger.error({
          message: `Could not find current step "${this.activeContent.title}" in flatSteps`,
        });
        return; // Don't proceed with navigation if we can't find current position
      }
    }

    const prevIndex = EFPNavigationUtils.findPreviousSelectableStep(
      this.currentStepIndex,
      this.flatSteps,
      this.sections
    );
    if (prevIndex != null) {
      const prevStep = this.flatSteps[prevIndex];

      // Check if previous step has the same label and content as current step
      // This can happen with duplicate entries like "My Action Plan"
      const currentStep = this.flatSteps[this.currentStepIndex];
      const isSameContent = currentStep &&
        currentStep.label === prevStep.label &&
        currentStep.content === prevStep.content;

      if (isSameContent) {
        logger.info({
          message: `Skipping duplicate step "${prevStep.label}" at index ${prevIndex}, continuing to previous`,
        });

        // Skip this duplicate and go to the previous step
        const prevPrevIndex = EFPNavigationUtils.findPreviousSelectableStep(
          prevIndex,
          this.flatSteps,
          this.sections
        );

        if (prevPrevIndex != null) {
          const prevPrevStep = this.flatSteps[prevPrevIndex];
          this.isNavigating = true;
          this.currentStepIndex = prevPrevIndex;
          this.currentSectionIndex = prevPrevStep.sectionIndex;
          this.activeContent = { title: prevPrevStep.label, content: prevPrevStep.content };
          this.updateNavigationState(prevPrevStep.label);

          // Scroll to top of main content to provide visual feedback
          this.updateComplete.then(() => {
            const mainContent = this.shadowRoot?.querySelector('main.main-content');
            if (mainContent) {
              mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          });

          setTimeout(() => {
            this.isNavigating = false;
          }, 100);
          this.requestUpdate();
        }
        return;
      }

      this.isNavigating = true;
      this.currentStepIndex = prevIndex;
      this.currentSectionIndex = prevStep.sectionIndex;
      this.activeContent = { title: prevStep.label, content: prevStep.content };
      this.updateNavigationState(prevStep.label);

      // Scroll to top of main content to provide visual feedback
      this.updateComplete.then(() => {
        const mainContent = this.shadowRoot?.querySelector('main.main-content');
        if (mainContent) {
          mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });

      setTimeout(() => {
        this.isNavigating = false;
      }, 100);
      this.requestUpdate();
    }
  }

  private get flatSteps(): EFPStep[] {
    return EFPNavigationUtils.getFlatStepsFromSections(this.sections);
  }

  private initializeToFirstSelectableStep() {
    // Only initialize if we have sections and steps available
    if (
      !this.sections ||
      this.sections.length === 0 ||
      !this.flatSteps ||
      this.flatSteps.length === 0
    ) {
      return;
    }

    // Navigate to first selectable step in the first section via utils
    const target = EFPNavigationUtils.navigateToSection(
      0,
      this.flatSteps,
      this.sections
    );
    if (target) {
      const step = this.flatSteps[target.stepIndex];
      this.currentStepIndex = target.stepIndex;
      this.currentSectionIndex = target.sectionIndex;
      this.activeContent = { title: step.label, content: step.content };
      this.updateNavigationState(step.label);
    }
  }

  private handleBreadcrumbNavigation(event: CustomEvent) {
    const { type, data } = event.detail;

    switch (type) {
      case 'home':
        this.navigateToHome();
        break;
      case 'section':
        this.navigateToSection(data.sectionIndex);
        break;
      case 'hierarchy':
        this.navigateToHierarchyItem(data.targetLabel);
        break;
    }
  }

  private navigateToHome() {
    // Navigate to first selectable step in first section
    const target = EFPNavigationUtils.navigateToSection(
      0,
      this.flatSteps,
      this.sections
    );
    if (target) {
      const step = this.flatSteps[target.stepIndex];
      this.currentStepIndex = target.stepIndex;
      this.currentSectionIndex = target.sectionIndex;
      this.activeContent = { title: step.label, content: step.content };
      this.updateNavigationState(step.label);
      this.requestUpdate();
    } else {
      // Fallback to first step
      this.currentStepIndex = 0;
      this.currentSectionIndex = 0;
      this.requestUpdate();
    }
  }

  private navigateToSection(sectionIndex: number) {
    const target = EFPNavigationUtils.navigateToSection(
      sectionIndex,
      this.flatSteps,
      this.sections
    );
    if (target) {
      const step = this.flatSteps[target.stepIndex];
      this.currentStepIndex = target.stepIndex;
      this.currentSectionIndex = target.sectionIndex;
      this.activeContent = { title: step.label, content: step.content };
      this.updateNavigationState(step.label);
      this.requestUpdate();
    }
  }

  private navigateToHierarchyItem(targetLabel: string) {
    // Find and navigate to this hierarchy level
    const hierarchyStepIndex = this.flatSteps.findIndex(
      (step) => step.label === targetLabel
    );
    if (hierarchyStepIndex !== -1) {
      const hierarchyStep = this.flatSteps[hierarchyStepIndex];
      this.currentStepIndex = hierarchyStepIndex;
      this.currentSectionIndex = hierarchyStep.sectionIndex;

      // Update active content
      this.activeContent = {
        title: hierarchyStep.label,
        content: hierarchyStep.content,
      };

      // Update navigation state
      this.updateNavigationState(hierarchyStep.label);
      this.requestUpdate();
    }
  }

  private renderItems(items: EFPSectionItem[]): unknown {
    return EFPRenderUtils.renderItems(
      items,
      html,
      this.activeContent.title,
      (item: EFPSectionItem) => this.handleItemClick(item),
      (items: EFPSectionItem[]) => this.renderItems(items),
      (item: EFPSectionItem) => this.getCompletionFromStore(item),
      (item: EFPSectionItem) => this.getSkippedFromStore(item)
    );
  }

  // Get skipped status for an item from the store
  private getSkippedFromStore(item: EFPSectionItem): boolean {
    // Only check for chapters (not questions or other items)
    if (!item.chapterId) {
      return false;
    }

    try {
      return this.isChapterSkippedById(item.chapterId);
    } catch (error) {
      logger.error({
        message: 'Error checking chapter skipped status',
        data: { chapterId: item.chapterId, error: (error as Error).message },
      });
      return false;
    }
  }

  updated(changedProps: Map<string, unknown>) {
    if (changedProps.has('currentStepIndex')) {
      EFPLifecycleUtils.handleStepIndexChange(
        this.currentStepIndex,
        this.flatSteps,
        this.activeContent,
        (newContent: EFPActiveContent) => {
          this.activeContent = newContent;
        },
        (label: string) => this.updateNavigationState(label)
      );
    }

    if (changedProps.has('currentSectionIndex')) {
      EFPLifecycleUtils.handleSectionIndexChange(
        this.currentSectionIndex,
        this.tabGroupEl
      );
    }

    // Re-render rating questions when workbook responses are loaded/updated
    if (changedProps.has('workbookResponses')) {
      // Update completion and navigation icons when responses change
      this.updateCompletionAndNavigation();
    }

    // Update active content when questions and responses are loaded
    if (changedProps.has('questionsAndResponsesLoaded')) {
      // Refresh the active content to show updated renderResponsesSummary
      const currentStep = this.flatSteps[this.currentStepIndex];
      if (currentStep) {
        this.activeContent = {
          title: currentStep.label,
          content: currentStep.content,
        };
      }
    }
  }

  // Lifecycle methods
  firstUpdated() {
    // Initialize to the first selectable step instead of potentially a section header
    this.initializeToFirstSelectableStep();

    // Load workbook responses
    this.loadWorkbookResponses();
  }

  willUpdate(changedProps: Map<string, unknown>) {
    if (changedProps.has('currentStepIndex')) {
      EFPLifecycleUtils.handleStepIndexChange(
        this.currentStepIndex,
        this.flatSteps,
        this.activeContent,
        (newContent: EFPActiveContent) => {
          this.activeContent = newContent;
        }
      );
    }
  }

  // Workbook response loading
  private async loadWorkbookResponses() {
    try {
      this.isLoadingResponses = true;
      POWERPOD.workbookQuestionsAndResponses.isLoading = true;
      POWERPOD.workbookQuestionsAndResponses.error = null;

      const workbookId = getWorkbookId();
      if (!workbookId) {
        logger.warn({
          message: 'No workbook ID found, skipping response loading',
        });
        return;
      }

      // Check if we already have questions and responses for this workbook
      if (
        POWERPOD.workbookQuestionsAndResponses.isLoaded &&
        POWERPOD.workbookQuestionsAndResponses.workbookId === workbookId
      ) {
        this.syncFromPOWERPOD();
        this.questionsAndResponsesLoaded = true;
        return;
      }

      logger.info({
        message: `Loading workbook questions and responses for workbook: ${workbookId}`,
      });

      // Load questions and responses into nested structure
      const result = (await WorkbookResponseHelper.loadQuestionsAndResponses(
        workbookId
      )) as QuestionsAndResponsesMemory;

      // Also maintain backward compatibility with old structure
      const responses = Array.from(result.questionsWithResponses.values())
        .map((entry) => entry.response)
        .filter((response) => response !== null);

      POWERPOD.workbookResponses.data = responses;
      POWERPOD.workbookResponses.workbookId = workbookId;
      POWERPOD.workbookResponses.isLoaded = true;
      POWERPOD.workbookResponses.lastUpdated = new Date().toISOString();

      // Build quick lookup map for backward compatibility
      POWERPOD.workbookResponses.responsesByQuestion.clear();
      responses.forEach((response) => {
        const questionId = response._quartech_question_value;
        if (questionId) {
          if (!POWERPOD.workbookResponses.responsesByQuestion.has(questionId)) {
            POWERPOD.workbookResponses.responsesByQuestion.set(
              questionId,
              response
            );
          }
        }
      });

      // Sync to local component state for UI binding
      this.syncFromPOWERPOD();

      // Update the reactive property to trigger re-render
      this.questionsAndResponsesLoaded = true;

      logger.info({
        message: `Loaded ${result.stats.totalQuestions} questions with ${result.stats.answeredQuestions} responses (${result.stats.completionPercentage}% complete)`,
      });

      // Trigger a re-render to update the UI with loaded data
      this.requestUpdate();
    } catch (error) {
      logger.error({
        message: 'Failed to load workbook questions and responses',
      });
      const errMsg =
        (error as any)?.message || 'Failed to load questions and responses';
      POWERPOD.workbookQuestionsAndResponses.error = errMsg;
      // Don't throw - we want the component to still work even if loading fails
    } finally {
      this.isLoadingResponses = false;
      POWERPOD.workbookQuestionsAndResponses.isLoading = false;
    }
  }

  // Sync local component state from POWERPOD memory
  private syncFromPOWERPOD() {
    this.workbookResponses = POWERPOD.workbookResponses.data;

    // Update completion and navigation icons
    this.updateCompletionAndNavigation();
  }

  // Update completion tracking and navigation icons based on current responses
  private updateCompletionAndNavigation() {
    // Update section completion status based on workbook responses
    this.updateSectionCompletionStatus();

    // Trigger re-render to update progress bar and navigation icons
    this.requestUpdate();

    // Log current completion status
    const completionPercent = this.completionPercent;
    logger.info({ message: `📊 Overall completion: ${completionPercent}%` });

    if (POWERPOD.workbookQuestionsAndResponses.isLoaded) {
      const stats = POWERPOD.workbookQuestionsAndResponses.stats;
    }
  }

  // Update section completion status using questionnaire store
  private updateSectionCompletionStatus() {
    // Try to use questionnaire store first (preferred method)
    if (isQuestionnaireLoaded()) {
      try {
        // Import the completion function dynamically to avoid circular imports
        import('../common/questionnaire.js').then(
          ({ updateQuestionnaireCompletion }) => {
            updateQuestionnaireCompletion();
            this.updateSectionItemsFromQuestionnaireStore();
            logger.info({
              message: '✅ Updated completion using questionnaire store',
            });
          }
        );
        return;
      } catch (error) {
        logger.warn({
          message:
            '⚠️ Failed to use questionnaire store for completion, falling back to legacy method',
        });
      }
    }

    // Fallback to legacy method if questionnaire store is not available
    if (!POWERPOD.workbookQuestionsAndResponses.isLoaded) {
      logger.warn({
        message:
          '⚠️ Neither questionnaire store nor workbook responses loaded, skipping completion update',
      });
      return;
    }

    const questionsWithResponses =
      POWERPOD.workbookQuestionsAndResponses.questionsWithResponses;
    const questionsByChapter =
      POWERPOD.workbookQuestionsAndResponses.questionsByChapter;

    // Update section completion based on chapter completion
    this.sections.forEach((section) => {
      this.updateSectionItemsCompletion(section.items, questionsWithResponses);
    });
  }

  // Update section items using questionnaire store data
  private updateSectionItemsFromQuestionnaireStore() {
    this.sections.forEach((section) => {
      if (section.tab === 'My Workbook') {
        // Update My Workbook items using questionnaire store
        this.updateSectionItemsFromStore(section.items);
      }
    });
  }

  // Recursively update section items using questionnaire store
  private updateSectionItemsFromStore(items: any[]) {
    items.forEach((item) => {
      if ('items' in item && Array.isArray(item.items)) {
        // Recursively update nested items
        this.updateSectionItemsFromStore(item.items);

        // Update parent completion based on children
        const allChildrenComplete = item.items.every((child: any) => {
          if ('items' in child && Array.isArray(child.items)) {
            return child.complete;
          } else if (child.questionId) {
            // Import questionnaire functions dynamically
            import('../common/questionnaire.js').then(
              ({ getQuestionFromStore }) => {
                const question = getQuestionFromStore(child.questionId);
                child.complete = question?.complete || false;
              }
            );
            return child.complete;
          }
          return child.complete;
        });

        item.complete = allChildrenComplete;
      } else if (item.chapterId) {
        // This is a chapter item - get completion from questionnaire store
        import('../common/questionnaire.js').then(({ getChapterFromStore }) => {
          const chapter = getChapterFromStore(item.chapterId);
          if (chapter) {
            item.complete = chapter.complete;
          }
        });
      } else if (item.questionId) {
        // This is a question item - get completion from questionnaire store
        import('../common/questionnaire.js').then(
          ({ getQuestionFromStore }) => {
            const question = getQuestionFromStore(item.questionId);
            if (question) {
              item.complete = question.complete;
            }
          }
        );
      }
    });
  }

  // Recursively update completion status for section items (legacy method)
  private updateSectionItemsCompletion(
    items: any[],
    questionsWithResponses: Map<string, any>
  ) {
    items.forEach((item) => {
      if ('items' in item && Array.isArray(item.items)) {
        // Recursively update nested items
        this.updateSectionItemsCompletion(item.items, questionsWithResponses);

        // Update parent item completion based on children
        const childItems = this.getAllLeafItems(item.items);
        const completedChildren = childItems.filter(
          (child) => child.complete
        ).length;
        item.complete =
          completedChildren === childItems.length && childItems.length > 0;
      } else if (item.questionId) {
        // This is a question item - check if it has a response
        const questionResponse = questionsWithResponses.get(item.questionId);
        const wasComplete = item.complete;
        item.complete = questionResponse && questionResponse.response !== null;

        if (wasComplete !== item.complete) {
        }
      }
    });
  }

  // Helper method to get all leaf items from a nested structure
  private getAllLeafItems(items: any[]): any[] {
    const leafItems: any[] = [];

    const collect = (itemList: any[]) => {
      for (const item of itemList) {
        if ('items' in item && Array.isArray(item.items)) {
          collect(item.items);
        } else {
          leafItems.push(item);
        }
      }
    };

    collect(items);
    return leafItems;
  }

  // Helper method to get response for a specific question
  getResponseForQuestion(questionId: string): any | null {
    // Use new nested structure first, fall back to old structure
    const questionAndResponse =
      WorkbookResponseHelper.getQuestionAndResponseFromMemory(questionId);
    if (questionAndResponse) {
      return questionAndResponse.response;
    }

    // Fallback to old structure for backward compatibility
    return (
      POWERPOD.workbookResponses.responsesByQuestion.get(questionId) || null
    );
  }

  // Helper method to get question data for a specific question
  getQuestionForQuestion(questionId: string): any | null {
    const questionAndResponse =
      WorkbookResponseHelper.getQuestionAndResponseFromMemory(questionId);
    return questionAndResponse?.question || null;
  }

  // Helper method to get both question and response data
  getQuestionAndResponse(questionId: string): {
    question: any | null;
    response: any | null;
  } {
    const questionAndResponse =
      WorkbookResponseHelper.getQuestionAndResponseFromMemory(questionId);
    if (questionAndResponse) {
      return {
        question: questionAndResponse.question,
        response: questionAndResponse.response,
      };
    }

    // Fallback to old structure
    return {
      question: null,
      response: this.getResponseForQuestion(questionId),
    };
  }

  // Helper method to render response information for a question
  renderResponseInfo(questionId: string): string {
    const response = this.getResponseForQuestion(questionId);
    if (!response) {
      return '<p style="color: var(--sl-color-neutral-600); font-style: italic;"><em>No response yet.</em></p>';
    }

    const createdDate = new Date(response.createdon).toLocaleDateString();
    const modifiedDate = new Date(response.modifiedon).toLocaleDateString();

    return `
      <div style="margin-top: 1.5rem; padding: 1rem; background-color: var(--sl-color-success-50); border-radius: var(--sl-border-radius-medium); border-left: 4px solid var(--sl-color-success-600);">
        <h4 style="margin: 0 0 0.75rem 0; color: var(--sl-color-success-800); font-size: 1.1rem;">Your Previous Response</h4>
        <div style="background-color: white; padding: 0.75rem; border-radius: var(--sl-border-radius-small); margin-bottom: 0.75rem;">
          <p style="margin: 0; line-height: 1.5; color: var(--sl-color-neutral-800);">${
            response.quartech_response || 'No response text available.'
          }</p>
        </div>
        <div style="font-size: 0.875rem; color: var(--sl-color-neutral-600);">
          <p style="margin: 0;"><strong>Created:</strong> ${createdDate}</p>
          ${
            createdDate !== modifiedDate
              ? `<p style="margin: 0;"><strong>Last Modified:</strong> ${modifiedDate}</p>`
              : ''
          }
        </div>
      </div>
    `;
  }

  // Helper method to render all responses summary (for debugging/admin)
  renderResponsesSummary(): string {
    const questionsAndResponses = POWERPOD.workbookQuestionsAndResponses;

    if (!questionsAndResponses.isLoaded) {
      return '<p><em>Questions and responses not loaded yet.</em></p>';
    }

    const stats = questionsAndResponses.stats;
    if (stats.totalQuestions === 0) {
      return '<p><em>No questions found for this workbook.</em></p>';
    }

    return `
      <div style="margin-top: 1rem;">
        <h4>Questions & Responses Summary</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <div>
            <p><strong>Total Questions:</strong> ${
              POWERPOD.workbookQuestionsAndResponses.stats.totalQuestions
            }</p>
            <p><strong>Answered Questions:</strong> ${
              POWERPOD.workbookQuestionsAndResponses.stats.answeredQuestions
            }</p>
            <p><strong>Unanswered Questions:</strong> ${
              POWERPOD.workbookQuestionsAndResponses.stats.unansweredQuestions
            }</p>
          </div>
          <div>
            <p><strong>Completion:</strong> ${
              POWERPOD.workbookQuestionsAndResponses.stats.completionPercentage
            }%</p>
            <p><strong>Chapters:</strong> ${
              POWERPOD.workbookQuestionsAndResponses.questionsByChapter.size
            }</p>
            <p><strong>Last Updated:</strong> ${
              POWERPOD.workbookQuestionsAndResponses.lastUpdated
                ? new Date(
                    POWERPOD.workbookQuestionsAndResponses.lastUpdated
                  ).toLocaleString()
                : 'Unknown'
            }</p>
          </div>
        </div>

        <details style="margin-top: 1rem;">
          <summary style="cursor: pointer; font-weight: 500;">View Questions & Responses by Chapter</summary>
          <div style="margin-top: 0.5rem; max-height: 400px; overflow-y: auto;">
            ${Array.from(questionsAndResponses.questionsByChapter.entries())
              .map(
                ([chapterId, chapterQuestions]) => `
              <div style="margin-bottom: 1.5rem; padding: 1rem; background-color: var(--sl-color-neutral-50); border-radius: var(--sl-border-radius-medium);">
                <h5 style="margin: 0 0 0.75rem 0; color: var(--sl-color-primary-600);">Chapter: ${chapterId}</h5>
                <p style="margin: 0 0 0.75rem 0; font-size: 0.875rem; color: var(--sl-color-neutral-600);">
                  ${chapterQuestions.length} questions, ${
                  chapterQuestions.filter((q) => q.response).length
                } answered
                </p>
                ${chapterQuestions
                  .map(
                    (entry) => `
                  <div style="padding: 0.5rem; margin: 0.5rem 0; background-color: white; border-radius: var(--sl-border-radius-small); border-left: 3px solid ${
                    entry.response
                      ? 'var(--sl-color-success-600)'
                      : 'var(--sl-color-neutral-300)'
                  };">
                    <p style="margin: 0 0 0.25rem 0; font-weight: 500; font-size: 0.875rem;">
                      ${
                        entry.question
                          ? (
                              entry.question.quartech_label ||
                              entry.question.quartech_questiontext ||
                              'Question text not available'
                            ).replace(/\n/g, '<br>')
                          : 'Question data not loaded'
                      }
                    </p>
                    ${
                      entry.response
                        ? `
                      <p style="margin: 0 0 0.25rem 0; color: var(--sl-color-success-800);">
                        <strong>Response:</strong> ${
                          entry.response.quartech_response || 'No response text'
                        }
                      </p>
                      <p style="margin: 0; font-size: 0.75rem; color: var(--sl-color-neutral-600);">
                        Answered: ${new Date(
                          entry.response.createdon
                        ).toLocaleString()}
                      </p>
                    `
                        : `
                      <p style="margin: 0; font-style: italic; color: var(--sl-color-neutral-500);">Not answered yet</p>
                    `
                    }
                  </div>
                `
                  )
                  .join('')}
              </div>
            `
              )
              .join('')}
          </div>
        </details>

        <details style="margin-top: 1rem;">
          <summary style="cursor: pointer; font-weight: 500;">View All Questions & Responses (Flat List)</summary>
          <div style="margin-top: 0.5rem; max-height: 300px; overflow-y: auto;">
            ${Array.from(questionsAndResponses.questionsWithResponses.entries())
              .map(
                ([questionId, entry]) => `
              <div style="padding: 0.5rem; margin: 0.5rem 0; background-color: var(--sl-color-neutral-50); border-radius: var(--sl-border-radius-small); border-left: 3px solid ${
                entry.response
                  ? 'var(--sl-color-success-600)'
                  : 'var(--sl-color-neutral-300)'
              };">
                <p style="margin: 0 0 0.25rem 0; font-weight: 500; font-size: 0.875rem;">Question ID: ${questionId}</p>
                ${
                  entry.question
                    ? `
                  <p style="margin: 0 0 0.25rem 0; color: var(--sl-color-neutral-700);">
                    <strong>Question:</strong> ${(
                      entry.question.quartech_label ||
                      entry.question.quartech_questiontext ||
                      'No question text'
                    ).replace(/\n/g, '<br>')}
                  </p>
                `
                    : ''
                }
                ${
                  entry.response
                    ? `
                  <p style="margin: 0 0 0.25rem 0; color: var(--sl-color-success-800);">
                    <strong>Response:</strong> ${
                      entry.response.quartech_response || 'No response text'
                    }
                  </p>
                  <p style="margin: 0; font-size: 0.75rem; color: var(--sl-color-neutral-600);">
                    Created: ${new Date(
                      entry.response.createdon
                    ).toLocaleString()}
                    ${
                      entry.response.modifiedon !== entry.response.createdon
                        ? ` | Modified: ${new Date(
                            entry.response.modifiedon
                          ).toLocaleString()}`
                        : ''
                    }
                  </p>
                `
                    : `
                  <p style="margin: 0; font-style: italic; color: var(--sl-color-neutral-500);">Not answered yet</p>
                `
                }
              </div>
            `
              )
              .join('')}
          </div>
        </details>
      </div>
    `;
  }

  render() {
    return html`
      <div class="container">
        <!-- Sidebar -->
        <aside class="sidebar">
          <div class="card">
            <div><strong>EFP Workbook:</strong> Test</div>
            <div><strong>Status:</strong> In Progress</div>
            <div>
              <strong>Questions & Responses:</strong>
              ${POWERPOD.workbookQuestionsAndResponses.isLoading
                ? html`<span style="color: var(--sl-color-warning-600);"
                    >Loading...</span
                  >`
                : POWERPOD.workbookQuestionsAndResponses.error
                ? html`<span style="color: var(--sl-color-danger-600);"
                    >Error loading</span
                  >`
                : html`<span style="color: var(--sl-color-success-600);"
                    >Loaded</span
                  >`}
            </div>
            ${POWERPOD.workbookQuestionsAndResponses.isLoaded
              ? html`
                  <div>
                    <strong>Total Questions:</strong> ${POWERPOD
                      .workbookQuestionsAndResponses.stats.totalQuestions}
                  </div>
                  <div>
                    <strong>Answered:</strong> ${POWERPOD
                      .workbookQuestionsAndResponses.stats.answeredQuestions}
                  </div>
                  <div>
                    <strong>Completion:</strong> ${POWERPOD
                      .workbookQuestionsAndResponses.stats
                      .completionPercentage}%
                  </div>
                  <div>
                    <strong>Chapters:</strong> ${POWERPOD
                      .workbookQuestionsAndResponses.questionsByChapter.size}
                  </div>
                `
              : ''}
          </div>

          <sl-tab-group
            .activeTab=${`section-${this.currentSectionIndex}`}
            @sl-tab-show=${(e: CustomEvent) => {
              const tabIndex = parseInt(e.detail.name.replace('section-', ''));
              this.handleSectionChange(tabIndex);
            }}
          >
            ${this.sections.map((section, index) => {
              const isActive = index === this.currentSectionIndex;
              const isComplete = this.getSectionCompletionFromStore(section);
              const isSkipped = this.getSectionSkippedFromStore(section);

              // Determine icon based on state: skipped > complete > incomplete
              let icon: string;
              let color: string;

              if (isSkipped) {
                icon = 'dash-circle-fill';
                color = isActive ? 'orange' : 'gray';
              } else if (isComplete) {
                icon = 'check-circle';
                color = isActive ? 'orange' : 'green';
              } else {
                icon = 'pencil';
                color = isActive ? 'orange' : 'gray';
              }

              return html`
                <sl-tab slot="nav" panel="section-${index}">
                  <sl-icon
                    name=${icon}
                    style="color: ${color}; margin-right: 0.5rem;"
                  ></sl-icon>
                  <span style=${isActive ? 'font-weight: bold;' : ''}
                    >${section.tab}</span
                  >
                </sl-tab>
              `;
            })}
            ${this.sections.map(
              (section, index) => html`
                <sl-tab-panel name="section-${index}">
                  <div class="card">
                    <strong>${section.title}</strong>
                  </div>
                  ${this.renderItems(section.items)}
                </sl-tab-panel>
              `
            )}
          </sl-tab-group>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
          <div class="card">
            <strong
              >${POWERPOD.workbookQuestionsAndResponses.isLoaded
                ? POWERPOD.workbookQuestionsAndResponses.stats
                    .completionPercentage
                : this.completionPercent}%
              Complete</strong
            >
            <div
              style="
              width: 100%;
              height: 0.75rem;
              background-color: #e5e7eb;
              border-radius: 0.375rem;
              margin-top: 0.5rem;
              overflow: hidden;
            "
            >
              <div
                style="
                height: 100%;
                background-color: #3b82f6;
                border-radius: 0.375rem;
                transition: width 0.3s ease;
                width: ${POWERPOD.workbookQuestionsAndResponses.isLoaded
                  ? POWERPOD.workbookQuestionsAndResponses.stats
                      .completionPercentage
                  : this.completionPercent}%;
              "
              ></div>
            </div>
          </div>

          <!-- Navigation buttons above content -->
          <navigation-buttons
            .isPreviousDisabled=${this.currentStepIndex === 0}
            .isContinueDisabled=${this.isContinueButtonDisabled}
            .sectionsLength=${this.sections.length}
            @previous-clicked=${this.handleNavigationPrevious}
            @skip-clicked=${this.handleNavigationSkip}
            @continue-clicked=${this.handleNavigationContinue}
          ></navigation-buttons>

          <!-- Validation Dialog for Incomplete Questions -->
          <sl-dialog
            label="Incomplete Questions"
            @sl-after-hide=${this.hideValidationAlert}
          >
            <sl-icon slot="icon" name="exclamation-triangle" style="color: var(--sl-color-warning-600);"></sl-icon>
            <p style="margin-top: 0;">
              <strong>Please complete all required questions</strong>
            </p>
            <p>
              You must answer all non-skipped questions before proceeding to
              "Review & Submit".
            </p>
            <sl-button
              slot="footer"
              variant="primary"
              @click=${() => {
                // Close the dialog
                const dialog = this.shadowRoot?.querySelector('sl-dialog');
                if (dialog) {
                  (dialog as any).hide();
                }
                // Navigate to the next required step
                this.handleNavigationSkip(new CustomEvent('skip-clicked'));
              }}
            >
              <sl-icon slot="prefix" name="arrow-right-circle"></sl-icon>
              Skip to Next Required Step
            </sl-button>
            <sl-button
              slot="footer"
              variant="default"
              @click=${() => {
                const dialog = this.shadowRoot?.querySelector('sl-dialog');
                if (dialog) {
                  (dialog as any).hide();
                }
              }}
            >
              Close
            </sl-button>
          </sl-dialog>

          <div class="card card-with-lock">
            ${this.renderLockIcon()}
            <efp-breadcrumbs
              .currentStep=${this.flatSteps[this.currentStepIndex]}
              .currentSection=${this.sections[this.currentSectionIndex]}
              .currentSectionIndex=${this.currentSectionIndex}
              .currentStepIndex=${this.currentStepIndex}
              .flatSteps=${this.flatSteps}
              .sections=${this.sections}
              @breadcrumb-navigate=${this.handleBreadcrumbNavigation}
            ></efp-breadcrumbs>
            ${this.renderSectionNotApplicableCheckbox()}
            <h2>${this.activeContent.title}</h2>
            ${this.renderMainContent()}

            <!-- Slot for light DOM content (e.g., action plan) -->
            <slot></slot>
          </div>

          <!-- Navigation buttons below content -->
          <navigation-buttons
            .isPreviousDisabled=${this.currentStepIndex === 0}
            .isContinueDisabled=${this.isContinueButtonDisabled}
            .sectionsLength=${this.sections.length}
            @previous-clicked=${this.handleNavigationPrevious}
            @skip-clicked=${this.handleNavigationSkip}
            @continue-clicked=${this.handleNavigationContinue}
          ></navigation-buttons>
        </main>
      </div>
    `;
  }
}
