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
import '@shoelace-style/shoelace/dist/components/badge/badge.js';

import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import './NavigationButtons';
import './RatingQuestion';
import './EFPBreadcrumbs';
import './WorkbookSignOffButtons';
import './ActionPlanTable';
import './ProgressHeader';
import './NavigationSidebar';
import './QuestionRenderer';
import './WorkbookSearchDialog';
import WorkbookResponseHelper, { getChapterIdForQuestion } from '../common/workbookResponseHelper.js';
import { getWorkbookId, getWorkbookData } from '../common/workbookUtils.js';
import { getWorkbookDataById } from '../common/fetch.js';
import { POWERPOD, YES_VALUE } from '../common/constants.js';
import { Logger } from '../common/logger.js';
import store from '../store/index.js';
import {
  getQuestionnaireFromStore,
  getChapterFromStore,
  getQuestionFromStore,
  isQuestionnaireLoaded,
} from '../common/questionnaire.js';
import { EFPEventUtils } from './efp/event-utils.js';
import { EFPCompletionUtils, CompletionContext } from './efp/completion-utils.js';
import { EFPNavigationUtils, NavigationContext, NavigationResult } from './efp/navigation-utils.js';
import { EFPLifecycleUtils } from './efp/lifecycle-utils.js';
import { EFPSectionGenerator } from './efp/section-generator.js';
import { EFPRenderUtils } from './efp/render-utils.js';

import { efpEntryFormStyles } from './EFPEntryForm.styles';

// Service layer imports
import { ServiceContainer, getServices } from '../services/ServiceContainer.js';

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
  // ========================================
  // SERVICE LAYER (NEW ARCHITECTURE)
  // ========================================
  private services: ServiceContainer;

  // ========================================
  // REACTIVE PROPERTIES
  // ========================================
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
  @property({ type: Boolean, attribute: false }) hasTriedToSubmit = false; // Track if user has tried to navigate to Review & Submit
  @property({ type: Array, attribute: false }) incompleteChapters: Array<{
    chapterId: string;
    chapterName: string;
    totalQuestions: number;
    answeredQuestions: number;
  }> = [];
  @property({ type: Number, attribute: false }) responseUpdateCounter = 0; // Triggers re-render when responses change
  @property({ type: Number, attribute: false }) currentCompletionPercentage = 0; // Local copy of completion percentage for reactive rendering
  private isNavigating = false; // Flag to prevent tab change interference
  @property({ type: Object }) activeContent: EFPActiveContent = {
    title: 'Introduction to the Environmental Farm Plan (EFP)',
    content:
      'The purpose of the EFP is to assess the features and management of your farm to identify environmental risks and develop an action plan.',
  };

  // ========================================
  // QUERY SELECTORS
  // ========================================
  @query('sl-tab-group') tabGroupEl!: HTMLElement & {
    show: (tabName: string) => void;
  };

  @query('#global-action-plan-table') actionPlanTableEl!: HTMLElement & {
    openCreateDialogWithSelection: (chapterId: string, questionId: string) => void;
    getActionPlanCountForQuestion: (questionId: string) => number;
    getActionPlansForQuestion: (questionId: string) => any[];
    openViewActionsDialog: (questionId: string) => void;
  };

  @query('workbook-search-dialog') searchDialogEl!: HTMLElement & {
    show: () => void;
    hide: () => void;
  };



  // ========================================
  // CONSTRUCTOR
  // ========================================
  constructor() {
    super();
    // Initialize service container
    this.services = getServices();
    logger.info({ message: 'EFPEntryForm constructor - services initialized' });
  }

  connectedCallback() {
    super.connectedCallback();
    logger.info({ message: 'EFPEntryForm connected' });

    // ========================================
    // SERVICE EVENT LISTENERS (NEW ARCHITECTURE)
    // ========================================
    // Listen for response events from service
    this.services.responseService.on('response-saved', this.handleServiceResponseSaved);
    this.services.responseService.on('response-changed', this.handleServiceResponseChanged);
    this.services.responseService.on('save-status-changed', this.handleServiceSaveStatusChanged);
    this.services.responseService.on('multiline-text-status-changed', this.handleServiceMultilineStatusChanged);

    // Listen for chapter skip events from service
    this.services.chapterService.on('chapter-skipped-changed', this.handleServiceChapterSkippedChanged);

    // Listen for state changes from state managers
    this.services.workbookState.on('state-changed', this.handleServiceWorkbookStateChanged);
    this.services.navigationState.on('navigation-changed', this.handleServiceNavigationChanged);

    // ========================================
    // LEGACY INITIALIZATION
    // ========================================
    // Check if questionnaire store is already loaded
    this.updateQuestionnaireStoreStatus();

    // Set up periodic check for questionnaire store loading
    this.setupQuestionnaireStoreWatcher();

    // Check and update workbook lock status
    this.updateWorkbookLockStatus();

    // Listen for action plan updates to refresh badge counts
    this.addEventListener('action-plans-updated', this.handleActionPlansUpdated as EventListener);

    // Listen for sign-off changes to update lock status
    this.addEventListener('sign-off-changed', this.handleSignOffChanged as EventListener);

    // Listen for workbook stats updates to trigger re-render of progress bar
    this.addEventListener('workbook-stats-updated', this.handleStatsUpdated as EventListener);

    // Listen for CMD+K / Ctrl+K to open search dialog
    document.addEventListener('keydown', this.handleGlobalKeyDown);
  }

  // ========================================
  // SERVICE EVENT HANDLERS (NEW ARCHITECTURE)
  // ========================================
  private handleServiceResponseSaved = (data: any) => {
    logger.info({ message: 'Service: Response saved', data });
    // Trigger re-render to update UI
    this.responseUpdateCounter++;
    this.requestUpdate();
  };

  // Handler for optimistic response updates (immediate UI feedback)
  private handleServiceResponseChanged = (data: any) => {
    logger.info({ message: 'Service: Response changed (optimistic)', data });
    // Trigger re-render for immediate UI feedback
    this.responseUpdateCounter++;
    this.requestUpdate();
    // Also update completion status since response may affect it
    this.updateCompletionAndNavigation();
  };

  // Handler for save status changes (saving/saved indicators)
  private handleServiceSaveStatusChanged = (data: any) => {
    logger.info({ message: 'Service: Save status changed', data });
    // Increment counter to trigger child QuestionRenderer re-renders
    this.responseUpdateCounter++;
    this.requestUpdate();
  };

  private handleServiceMultilineStatusChanged = (data: any) => {
    logger.info({ message: 'Service: Multiline text status changed', data });
    // Service manages the state, just trigger re-render
    this.requestUpdate();
  };

  private handleServiceChapterSkippedChanged = (data: any) => {
    logger.info({ message: 'Service: Chapter skipped changed', data });

    // If this is a rollback, show a brief error toast
    if (data?.rollback) {
      logger.warn({
        message: 'Chapter skip change rolled back due to backend failure',
        data: { chapterId: data.chapterId },
      });
      // Could add toast notification here if desired
    }

    // Trigger re-render and update completion
    // This will read the current memory state (which may have been rolled back)
    this.updateCompletionAndNavigation();
  };

  private handleServiceWorkbookStateChanged = (data: any) => {
    logger.info({ message: 'Service: Workbook state changed', data });
    // Sync local state with service state
    const state = this.services.workbookState.getState();
    this.workbookLocked = state.workbookLocked;
    this.questionnaireStoreLoaded = state.questionnaireStoreLoaded;
    this.questionsAndResponsesLoaded = state.questionsAndResponsesLoaded;
    this.isLoadingResponses = state.isLoadingResponses;
    this.requestUpdate();
  };

  private handleServiceNavigationChanged = (data: any) => {
    logger.info({ message: 'Service: Navigation changed', data });
    // Sync local state with navigation state
    const state = this.services.navigationState.getState();
    this.currentSectionIndex = state.currentSectionIndex;
    this.currentStepIndex = state.currentStepIndex;
    if (state.activeContent) {
      this.activeContent = state.activeContent;
    }
    this.requestUpdate();
  };

  // Handler for workbook stats updates
  private handleStatsUpdated = (event: Event) => {
    const customEvent = event as CustomEvent;
    const oldPercentage = this.currentCompletionPercentage;
    const newPercentage = customEvent.detail?.completionPercentage ||
                         POWERPOD.workbookQuestionsAndResponses.stats.completionPercentage;

    logger.info({
      message: '📊 Workbook stats updated event received, triggering re-render',
      data: {
        oldPercentage,
        newPercentage,
        eventDetail: customEvent.detail,
        powerpodStats: POWERPOD.workbookQuestionsAndResponses.stats
      },
    });

    // Update the local completion percentage property to trigger reactive re-render
    // REFACTORED: Now uses WorkbookValidationService
    this.currentCompletionPercentage = this.services.validationService.calculateCompletionPercentage();

    // Increment the response update counter to trigger re-render
    this.responseUpdateCounter++;
    this.requestUpdate();

    logger.info({
      message: '📊 After update - currentCompletionPercentage is now',
      data: { currentCompletionPercentage: this.currentCompletionPercentage }
    });
  };

  disconnectedCallback() {
    super.disconnectedCallback();

    // ========================================
    // REMOVE SERVICE EVENT LISTENERS (NEW ARCHITECTURE)
    // ========================================
    this.services.responseService.off('response-saved', this.handleServiceResponseSaved);
    this.services.responseService.off('response-changed', this.handleServiceResponseChanged);
    this.services.responseService.off('save-status-changed', this.handleServiceSaveStatusChanged);
    this.services.responseService.off('multiline-text-status-changed', this.handleServiceMultilineStatusChanged);
    this.services.chapterService.off('chapter-skipped-changed', this.handleServiceChapterSkippedChanged);
    this.services.workbookState.off('state-changed', this.handleServiceWorkbookStateChanged);
    this.services.navigationState.off('navigation-changed', this.handleServiceNavigationChanged);

    // ========================================
    // CLEANUP
    // ========================================
    // Remove event listeners
    this.removeEventListener('action-plans-updated', this.handleActionPlansUpdated as EventListener);
    this.removeEventListener('sign-off-changed', this.handleSignOffChanged as EventListener);
    this.removeEventListener('workbook-stats-updated', this.handleStatsUpdated as EventListener);

    // Remove global keyboard listener
    document.removeEventListener('keydown', this.handleGlobalKeyDown);

    // Clean up services (they manage their own state)
    this.services.cleanup();

    logger.info({
      message: 'EFPEntryForm disconnected, cleaned up services and event listeners',
    });
  }

  // Handle sign-off changed event
  private handleSignOffChanged = async (event: Event) => {
    const customEvent = event as CustomEvent;
    logger.info({
      message: 'Sign-off changed, updating workbook lock status and refreshing workbook data',
      data: customEvent.detail,
    });

    // Refresh workbook data from API to get updated status
    await this.refreshWorkbookData();

    // Update workbook lock status when sign-off changes
    this.updateWorkbookLockStatus();
  };

  // Handle action plans updated event
  private handleActionPlansUpdated = (event: Event) => {
    const customEvent = event as CustomEvent;
    logger.info({
      message: 'Action plans updated, triggering re-render to update badge counts',
      data: customEvent.detail,
    });

    // Trigger a re-render to update badge counts
    this.requestUpdate();
  };

  // Handle global keyboard shortcuts (CMD+K / Ctrl+K for search)
  private handleGlobalKeyDown = (e: KeyboardEvent) => {
    // Check for CMD+K (Mac) or Ctrl+K (Windows/Linux)
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      this.openSearchDialog();
    }
  };

  // Open the search dialog
  private openSearchDialog() {
    logger.info({ message: 'Opening search dialog (CMD+K)' });
    this.searchDialogEl?.show();
  }

  // Handle navigation from search results
  private handleSearchNavigate(e: CustomEvent) {
    const { stepIndex, chapterId, questionId } = e.detail;

    logger.info({
      message: 'Navigating from search result',
      data: { stepIndex, chapterId, questionId },
    });

    if (stepIndex >= 0 && stepIndex < this.flatSteps.length) {
      const step = this.flatSteps[stepIndex];
      this.currentStepIndex = stepIndex;
      this.currentSectionIndex = step.sectionIndex;

      this.activeContent = {
        title: step.label,
        content: step.content,
      };

      this.updateNavigationState(step.label);
      this.requestUpdate();

      // If navigating to a specific question, scroll to it after render
      if (questionId) {
        this.updateComplete.then(() => {
          const questionEl = this.shadowRoot?.querySelector(`[data-question-id="${questionId}"]`);
          if (questionEl) {
            questionEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
      }
    }
  }

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

  // Refresh workbook data from API to get updated status
  private async refreshWorkbookData() {
    const workbookId = getWorkbookId();
    if (!workbookId) {
      logger.warn({
        message: 'Cannot refresh workbook data: no workbook ID found',
      });
      return;
    }

    try {
      logger.info({
        message: 'Refreshing workbook data from API (bypassing cache)',
        data: { workbookId },
      });

      // Use skipCache: true to bypass the cache and get fresh data from the API
      const response = await getWorkbookDataById({ id: workbookId, skipCache: true });
      const updatedWorkbookData = response.data;

      // Update the cached workbook data in POWERPOD
      // @ts-ignore
      if (POWERPOD.workbook) {
        // @ts-ignore
        POWERPOD.workbook.data = updatedWorkbookData;
        logger.info({
          message: 'Successfully refreshed workbook data',
          data: {
            workbookId,
            status: updatedWorkbookData?.['quartech_workbookstatus@OData.Community.Display.V1.FormattedValue'],
            paSigned: updatedWorkbookData?.quartech_pasigned,
            producerSigned: updatedWorkbookData?.quartech_producersigned,
          },
        });
      }

      // Trigger a re-render to update the UI with the new status
      this.requestUpdate();

      // Dispatch event to notify WorkbookSignOffButtons to refresh its data
      this.dispatchEvent(new CustomEvent('workbook-data-refreshed', {
        bubbles: true,
        composed: true,
        detail: {
          workbookId,
          status: updatedWorkbookData?.quartech_workbookstatus,
        },
      }));
    } catch (error) {
      logger.error({
        message: 'Failed to refresh workbook data',
        data: { workbookId, error: (error as Error).message },
      });
    }
  }

  // Check if all non-skipped questions in My Workbook are answered
  // REFACTORED: Now uses WorkbookValidationService
  private canAccessReviewAndSubmit(): boolean {
    logger.info({ message: '[NEW ARCHITECTURE] Checking Review & Submit access' });

    // ========================================
    // NEW ARCHITECTURE: Delegate to service
    // ========================================
    const canAccess = this.services.validationService.canAccessReviewAndSubmit();

    // Update incomplete chapters list for UI
    this.incompleteChapters = this.services.validationService.getIncompleteChapters();

    logger.info({
      message: `Review & Submit access: ${canAccess ? 'ALLOWED' : 'DENIED'}`,
      data: {
        canAccess,
        incompleteChaptersCount: this.incompleteChapters.length,
      },
    });

    return canAccess;
  }

  // Show validation alert with incomplete chapters
  private showIncompleteQuestionsAlert() {
    this.showValidationAlert = true;
    this.hasTriedToSubmit = true; // Mark that user has tried to submit

    // Build detailed logging info
    const totalIncompleteQuestions = this.incompleteChapters.reduce(
      (sum, chapter) => sum + (chapter.totalQuestions - chapter.answeredQuestions),
      0
    );

    // Log summary
    logger.info({
      message: 'Showing validation alert for incomplete questions',
      data: {
        incompleteChaptersCount: this.incompleteChapters.length,
        totalIncompleteQuestions,
      },
    });

    // Log detailed breakdown per chapter
    this.incompleteChapters.forEach((chapter) => {
      logger.info({
        message: `📋 Incomplete chapter: "${chapter.chapterName}"`,
        data: {
          chapterId: chapter.chapterId,
          chapterName: chapter.chapterName,
          totalQuestions: chapter.totalQuestions,
          answeredQuestions: chapter.answeredQuestions,
          incompleteQuestionCount: chapter.totalQuestions - chapter.answeredQuestions,
        },
      });
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

  // Rendering methods - delegates to QuestionRenderer component
  private renderQuestion(question: any) {
    const isDisabled = this.isQuestionDisabled(question.id);
    const existingResponse = this.getResponseForQuestion(question.id);
    const actionPlanCount = this.getActionPlanCount(question.id);

    return html`
      <question-renderer
        .question=${question}
        .isDisabled=${isDisabled}
        .hasTriedToSubmit=${this.hasTriedToSubmit}
        .responseService=${this.services.responseService}
        .existingResponse=${existingResponse}
        .actionPlanCount=${actionPlanCount}
        .updateCounter=${this.responseUpdateCounter}
        @rating-changed=${this.handleRatingChanged}
        @multiselect-changed=${this.handleMultiselectChangedEvent}
        @multiline-text-input=${this.handleMultilineTextInputEvent}
        @force-save=${this.handleForceSaveEvent}
        @add-note-to-action-plan=${this.handleAddNoteToActionPlanEvent}
        @view-existing-actions=${this.handleViewExistingActionsEvent}
      ></question-renderer>
    `;
  }

  // Event handlers for QuestionRenderer events
  private handleMultiselectChangedEvent(e: CustomEvent) {
    const { questionId, option, checked } = e.detail;
    this.handleMultiselectChange(questionId, option, checked);
  }

  private handleMultilineTextInputEvent(e: CustomEvent) {
    const { questionId, value } = e.detail;
    this.handleMultilineTextInput(questionId, value);
  }

  private handleForceSaveEvent(e: CustomEvent) {
    const { questionId } = e.detail;
    this.handleForceSave(questionId);
  }

  private handleAddNoteToActionPlanEvent(e: CustomEvent) {
    const { questionId } = e.detail;
    this.handleAddNoteToActionPlan(questionId);
  }

  private handleViewExistingActionsEvent(e: CustomEvent) {
    const { questionId } = e.detail;
    this.handleViewExistingActions(questionId);
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
        const preventSkipping = this.isSkippingPrevented();

        // Build tooltip content based on disabled reason
        const isDisabled = this.workbookLocked || preventSkipping;
        let tooltipContent = '';
        if (preventSkipping && !this.workbookLocked) {
          tooltipContent = 'This section is mandatory and cannot be skipped.';
        }

        const checkbox = html`
          <sl-checkbox
            ?checked=${isSkipped}
            ?disabled=${isDisabled}
            @sl-change=${this.handleChapterSkippedChange}>
            This section does not apply to this EFP.
          </sl-checkbox>
        `;

        return html`
          <div class="section-not-applicable">
            ${preventSkipping && !this.workbookLocked
              ? html`
                <sl-tooltip content="${tooltipContent}">
                  ${checkbox}
                </sl-tooltip>
              `
              : checkbox
            }
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

    // Hide lock icon for My Action Plan chapter (it should remain editable)
    const currentStep = this.flatSteps[this.currentStepIndex];
    if (currentStep?.label === 'My Action Plan') {
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
  // REFACTORED: Now uses ChapterManagementService
  private isChapterSkipped(): boolean {
    const chapterId = this.getCurrentChapterId();
    if (!chapterId) return false;

    // ========================================
    // NEW ARCHITECTURE: Delegate to service
    // ========================================
    return this.services.chapterService.isChapterSkipped(chapterId);
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
  // Note: Currently unused but may be needed for future features
  private _isChapterSkippedById(chapterId: string): boolean {
    return EFPCompletionUtils.isChapterSkippedById(
      chapterId,
      (id, excludePreventSkipping) => this.getQuestionsForCurrentChapter(id, excludePreventSkipping)
    );
  }

  // Check if skipping is prevented for the current chapter
  // This cascades: if a parent has preventSkipping: Yes, all children are also prevented from skipping
  // REFACTORED: Now uses ChapterManagementService
  private isSkippingPrevented(): boolean {
    const chapterId = this.getCurrentChapterId();
    if (!chapterId) return false;

    // ========================================
    // NEW ARCHITECTURE: Delegate to service
    // ========================================
    return this.services.chapterService.isSkippingPrevented(chapterId);
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
  // excludePreventSkipping: if true, excludes questions from chapters that have preventSkipping: Yes
  private getQuestionsForCurrentChapter(chapterId: string, excludePreventSkipping: boolean = false): any[] {
    const chapter = getChapterFromStore(chapterId);
    if (!chapter) return [];

    let questions: any[] = [...(chapter.questions || [])];

    // Also collect questions from subchapters
    if (chapter.subchapters) {
      const collectQuestionsFromSubchapters = (subchapters: any[]) => {
        for (const subchapter of subchapters) {
          // Skip this subchapter if it has preventSkipping: Yes and we're excluding those
          if (excludePreventSkipping && subchapter.preventSkipping === true) {
            continue;
          }

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
  // REFACTORED: Now uses ChapterManagementService with optimistic updates
  private handleChapterSkippedChange(event: CustomEvent) {
    const checkbox = event.target as any;
    const isChecked = checkbox.checked;

    const chapterId = this.getCurrentChapterId();
    if (!chapterId) {
      logger.warn({
        message: 'Cannot update chapter skipped: no chapter ID found',
      });
      return;
    }

    logger.info({
      message: `[NEW ARCHITECTURE] Handling chapter skip change for ${chapterId}`,
      data: { chapterId, isChecked },
    });

    // ========================================
    // NEW ARCHITECTURE: Delegate to service
    // Service emits 'chapter-skipped-changed' event immediately for instant UI update
    // Backend updates happen in background
    // ========================================
    this.services.chapterService.handleChapterSkippedChange(chapterId, isChecked)
      .then(() => {
        logger.info({
          message: `Successfully ${isChecked ? 'skipped' : 'unskipped'} chapter`,
          data: { chapterId, isChecked },
        });
      })
      .catch((error: Error) => {
        logger.error({
          message: `Failed to handle chapter skip change: ${error.message}`,
          data: { chapterId, isChecked },
        });
        // Rollback event was already emitted by service, but trigger re-render just in case
        this.requestUpdate();
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
      ${chapter?.questions
        ? chapter.questions.map((question: any) =>
            this.renderQuestion(question)
          )
        : ''}
    `;
  }

  private renderMainContent() {
    const currentStep = this.flatSteps[this.currentStepIndex];

    // Check if this step should render sign-off buttons
    const shouldRenderSignOffButtons = currentStep && 'renderSignOffButtons' in currentStep && (currentStep as any).renderSignOffButtons;

    const mainContent = EFPRenderUtils.renderMainContent(
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

    // If sign-off buttons should be rendered, append them as a live component
    if (shouldRenderSignOffButtons) {
      return html`
        ${mainContent}
        <workbook-sign-off-buttons></workbook-sign-off-buttons>
      `;
    }

    return mainContent;
  }

  // Generate Section B items directly from questionnaire store
  private getSectionBItemsFromStore(): EFPSectionItem[] {
    return EFPSectionGenerator.getSectionBItemsFromStore();
  }

  private getSectionCItemsFromPortalPage(): EFPSectionItem[] {
    return EFPSectionGenerator.getSectionCItemsFromPortalPage();
  }

  // Completion context for utility methods
  private getCompletionContext(): CompletionContext {
    return {
      hasTriedToSubmit: this.hasTriedToSubmit,
      getQuestionsForChapter: (chapterId: string, excludePreventSkipping?: boolean) =>
        this.getQuestionsForCurrentChapter(chapterId, excludePreventSkipping),
    };
  }

  private getCompletionFromStore(item: any): boolean {
    return EFPCompletionUtils.getCompletionFromStore(item);
  }

  private getSectionCompletionFromStore(section: any): boolean {
    return EFPCompletionUtils.getSectionCompletionFromStore(section);
  }

  private getSectionSkippedFromStore(section: any): boolean {
    return EFPCompletionUtils.getSectionSkippedFromStore(section);
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

  // Navigation methods - creates context for navigation utilities
  private getNavigationContext(): NavigationContext {
    return {
      currentStepIndex: this.currentStepIndex,
      flatSteps: this.flatSteps,
      sections: this.sections,
      activeContentTitle: this.activeContent.title,
      canAccessReviewAndSubmit: this.canAccessReviewAndSubmit(),
      getQuestionsForChapter: (chapterId: string) => this.getQuestionsForCurrentChapter(chapterId),
    };
  }

  // Apply navigation result to component state
  private applyNavigationResult(result: NavigationResult): void {
    if (!result.success) {
      if (result.showIncompleteAlert) {
        this.showIncompleteQuestionsAlert();
      }
      return;
    }

    this.isNavigating = true;
    if (result.newStepIndex !== undefined) {
      this.currentStepIndex = result.newStepIndex;
    }
    if (result.newSectionIndex !== undefined) {
      this.currentSectionIndex = result.newSectionIndex;
    }
    if (result.newActiveContent) {
      this.activeContent = result.newActiveContent;
      this.updateNavigationState(result.newActiveContent.title);
    }

    // Handle scrolling
    this.updateComplete.then(() => {
      if (result.scrollToQuestion) {
        // Small delay to ensure DOM is fully rendered
        setTimeout(() => {
          const questionElement = this.shadowRoot?.querySelector(
            `[data-question-id="${result.scrollToQuestion!.questionId}"]`
          ) as HTMLElement;

          if (questionElement) {
            questionElement.classList.add('question-highlight');
            questionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
              questionElement.classList.remove('question-highlight');
            }, 3000);
          }
        }, 200);
      } else if (result.scrollToTop) {
        const mainContent = this.shadowRoot?.querySelector('main.main-content');
        if (mainContent) {
          mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });

    setTimeout(() => {
      this.isNavigating = false;
    }, 100);
    this.requestUpdate();
  }

  private goToNext() {
    logger.info({
      message: `goToNext called, current step: ${this.currentStepIndex}, ${
        this.flatSteps[this.currentStepIndex]?.label
      }`,
    });

    const ctx = this.getNavigationContext();
    const result = EFPNavigationUtils.calculateNextNavigation(ctx);
    this.applyNavigationResult(result);
  }

  // Note: Currently unused but may be needed for future features
  private _findNextRequiredStep(): { stepIndex: number; questionId: string } | null {
    return EFPNavigationUtils.findNextRequiredStep(this.getNavigationContext());
  }

  // Navigation event handlers
  private handleNavigationPrevious() {
    this.goToPrevious();
  }

  private handleNavigationSkip(_event: CustomEvent) {
    const ctx = this.getNavigationContext();
    const result = EFPNavigationUtils.calculateSkipNavigation(ctx);
    this.applyNavigationResult(result);
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
      // The sl-tab-group is inside the navigation-sidebar component's shadow root
      setTimeout(() => {
        const sidebar = this.shadowRoot?.querySelector('navigation-sidebar');
        const tabGroup = sidebar?.shadowRoot?.querySelector('sl-tab-group') as any;
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

      // Delegate to service
      this.services.responseService.handleRatingChange(questionId, value);

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
        message: `Failed to handle rating change: ${(error as Error).message}`,
      });

      // Still call the original handler even if service fails
      EFPEventUtils.handleRatingChanged(
        event,
        (questionId: string, value: any) => {
          logger.info({
            message: `Rating stored locally for question ${questionId}: ${value} (service failed)`,
          });
        }
      );
    }
  }

  // Helper to get action plan count for a question
  private getActionPlanCount(questionId: string): number {
    if (!this.actionPlanTableEl || typeof this.actionPlanTableEl.getActionPlanCountForQuestion !== 'function') {
      return 0;
    }
    return this.actionPlanTableEl.getActionPlanCountForQuestion(questionId);
  }

  // Handler for "Add Note to Action Plan" button
  private handleAddNoteToActionPlan(questionId: string) {
    const chapterId = getChapterIdForQuestion(questionId);

    logger.info({
      message: 'Opening Action Plan dialog for question',
      data: { questionId, chapterId },
    });

    // Use the query-selected action-plan-table component
    if (this.actionPlanTableEl && typeof this.actionPlanTableEl.openCreateDialogWithSelection === 'function') {
      this.actionPlanTableEl.openCreateDialogWithSelection(chapterId || '', questionId);
    } else {
      logger.warn({
        message: 'Could not find action-plan-table component or openCreateDialogWithSelection method',
        data: { questionId, chapterId },
      });
    }
  }

  // Handler for "View Existing Actions" button
  private handleViewExistingActions(questionId: string) {
    logger.info({
      message: 'Viewing existing action plans for question',
      data: { questionId },
    });

    // Use the query-selected action-plan-table component to open the view dialog
    if (this.actionPlanTableEl && typeof this.actionPlanTableEl.openViewActionsDialog === 'function') {
      this.actionPlanTableEl.openViewActionsDialog(questionId);
    } else {
      logger.warn({
        message: 'Could not find action-plan-table component or openViewActionsDialog method',
        data: { questionId },
      });
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
      const optionsString = (question as any)?.multiselectOptions || '';
      const validOptions = optionsString
        .split(';')
        .map((opt: string) => opt.trim())
        .filter((opt: string) => opt.length > 0);

      // Delegate to service
      this.services.responseService.handleMultiselectChange(
        questionId,
        option,
        isChecked,
        validOptions
      );

    } catch (error) {
      logger.error({
        message: `Failed to handle multi-select change: ${
          (error as Error).message
        }`,
      });
    }
  }

  // Handle multiline text input with debounced save
  private handleMultilineTextInput(questionId: string, value: string) {
    try {
      logger.info({
        message: `Multiline text input for question ${questionId}`,
      });

      // Delegate to service
      this.services.responseService.handleMultilineTextInput(questionId, value);

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
      logger.info({
        message: `Force saving multiline text for question ${questionId}`,
      });

      // Delegate to service
      await this.services.responseService.forceSaveMultilineText(questionId);

    } catch (error) {
      logger.error({
        message: `Failed to force save multiline text: ${(error as Error).message}`,
      });
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

    const ctx = this.getNavigationContext();
    const result = EFPNavigationUtils.calculatePreviousNavigation(ctx);
    this.applyNavigationResult(result);
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
      (item: EFPSectionItem) => this.getSkippedFromStore(item),
      (item: EFPSectionItem) => this.getIncompleteFromStore(item)
    );
  }

  // Delegate to EFPCompletionUtils
  // Note: Currently unused but may be needed for future features
  private _hasIncompletePreventSkippingChildren(subchapters: any[]): boolean {
    return EFPCompletionUtils.hasIncompletePreventSkippingChildren(subchapters);
  }

  private getSkippedFromStore(item: EFPSectionItem): boolean {
    return EFPCompletionUtils.getSkippedFromStore(
      item,
      (chapterId, excludePreventSkipping) => this.getQuestionsForCurrentChapter(chapterId, excludePreventSkipping)
    );
  }

  private getIncompleteFromStore(item: EFPSectionItem): boolean {
    return EFPCompletionUtils.getIncompleteFromStore(item, this.getCompletionContext());
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

      // Initialize the completion percentage from loaded stats
      // REFACTORED: Now uses WorkbookValidationService
      this.currentCompletionPercentage = this.services.validationService.calculateCompletionPercentage();

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

    // Sync completion percentage from POWERPOD stats
    // REFACTORED: Now uses WorkbookValidationService
    if (POWERPOD.workbookQuestionsAndResponses.isLoaded) {
      this.currentCompletionPercentage = this.services.validationService.calculateCompletionPercentage();
    }

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
    return EFPSectionGenerator.getAllLeafItems(items);
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

  // Helper methods for NavigationSidebar
  private getSectionCompletionMap(): Map<number, boolean> {
    const map = new Map<number, boolean>();
    this.sections.forEach((section, index) => {
      map.set(index, this.getSectionCompletionFromStore(section));
    });
    return map;
  }

  private getSectionSkippedMap(): Map<number, boolean> {
    const map = new Map<number, boolean>();
    this.sections.forEach((section, index) => {
      map.set(index, this.getSectionSkippedFromStore(section));
    });
    return map;
  }

  private handleSidebarSectionChange(e: CustomEvent) {
    const { sectionIndex } = e.detail;
    this.handleSectionChange(sectionIndex);
  }

  render() {
    const workbookData = getWorkbookData() as any;
    const workbookId = workbookData?.quartech_digitalworkbookid || 'N/A';
    const workbookName = workbookData?.quartech_name || 'N/A';
    const workbookStatus = workbookData?.['quartech_workbookstatus@OData.Community.Display.V1.FormattedValue'] ?? 'N/A';

    return html`
      <div class="container">
        <!-- Sidebar -->
        <navigation-sidebar
          .workbookId=${workbookId}
          .workbookName=${workbookName}
          .workbookStatus=${workbookStatus}
          .sections=${this.sections}
          .currentSectionIndex=${this.currentSectionIndex}
          .sectionCompletion=${this.getSectionCompletionMap()}
          .sectionSkipped=${this.getSectionSkippedMap()}
          @section-change=${this.handleSidebarSectionChange}
        >
          ${this.sections.map(
            (section, index) => html`
              <div slot="section-${index}-items">
                ${this.renderItems(section.items)}
              </div>
            `
          )}
        </navigation-sidebar>

        <!-- Main Content -->
        <main class="main-content">
          <progress-header
            .completionPercentage=${POWERPOD.workbookQuestionsAndResponses.isLoaded
              ? this.currentCompletionPercentage
              : this.completionPercent}
          ></progress-header>

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

        <!-- Global Action Plan Table (hidden, used for creating action plans from questions) -->
        <action-plan-table
          id="global-action-plan-table"
          hide-table
        ></action-plan-table>

        <!-- CMD+K Search Dialog -->
        <workbook-search-dialog
          .flatSteps=${this.flatSteps}
          .sections=${this.sections}
          @search-navigate=${this.handleSearchNavigate}
        ></workbook-search-dialog>
      </div>
    `;
  }
}
