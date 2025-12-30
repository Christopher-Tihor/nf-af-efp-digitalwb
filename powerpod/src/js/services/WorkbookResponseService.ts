import { Logger } from '../common/logger.js';
import WorkbookResponseHelper from '../common/workbookResponseHelper.js';
import { POWERPOD } from '../common/constants.js';
import { getWorkbookId } from '../common/workbookUtils.js';
import { updateQuestionResponse } from '../common/questionnaire.js';

const logger = Logger('services/WorkbookResponseService');

/**
 * Service responsible for managing workbook responses
 * Handles CRUD operations, debouncing, and state synchronization
 */
export class WorkbookResponseService {
  // Debounce timers for all response saves (questionId -> timer)
  private responseSaveDebounceTimers: Map<string, number> = new Map();

  // Pending response values (questionId -> response value)
  private pendingResponseValues: Map<string, string> = new Map();

  // Pending multi-select values (questionId -> selected options array)
  private pendingMultiselectValues: Map<string, string[]> = new Map();

  // General save status for ALL question types (questionId -> 'draft' | 'saving' | 'saved')
  private responseSaveStatus: Map<string, 'draft' | 'saving' | 'saved'> = new Map();

  // Legacy: Multiline text save status (kept for backward compatibility, now uses responseSaveStatus)
  private multilineTextSaveStatus: Map<string, 'draft' | 'saving' | 'saved'> = new Map();

  // Multiline text character counts (questionId -> character count)
  private multilineTextCharCounts: Map<string, number> = new Map();

  // Event listeners for state changes
  private eventListeners: Map<string, Set<Function>> = new Map();

  constructor() {
    logger.info({ message: 'WorkbookResponseService initialized' });
  }

  /**
   * Clean up all pending timers and state
   */
  cleanup(): void {
    this.responseSaveDebounceTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    this.responseSaveDebounceTimers.clear();
    this.pendingResponseValues.clear();
    this.pendingMultiselectValues.clear();
    this.responseSaveStatus.clear();
    this.multilineTextSaveStatus.clear();
    this.multilineTextCharCounts.clear();
    this.eventListeners.clear();

    logger.info({ message: 'WorkbookResponseService cleaned up' });
  }

  /**
   * Subscribe to service events
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Unsubscribe from service events
   */
  off(event: string, callback: Function): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  /**
   * Emit an event to all listeners
   */
  private emit(event: string, data?: any): void {
    this.eventListeners.get(event)?.forEach(callback => callback(data));
  }

  /**
   * Get response for a specific question
   */
  getResponseForQuestion(questionId: string): any | null {
    const questionAndResponse = WorkbookResponseHelper.getQuestionAndResponseFromMemory(questionId);
    if (questionAndResponse) {
      return questionAndResponse.response;
    }

    // Fallback to old structure for backward compatibility
    return POWERPOD.workbookResponses.responsesByQuestion.get(questionId) || null;
  }

  /**
   * Get question data for a specific question
   */
  getQuestionForQuestion(questionId: string): any | null {
    const questionAndResponse = WorkbookResponseHelper.getQuestionAndResponseFromMemory(questionId);
    return questionAndResponse?.question || null;
  }

  /**
   * Get both question and response data
   */
  getQuestionAndResponse(questionId: string): { question: any | null; response: any | null } {
    const questionAndResponse = WorkbookResponseHelper.getQuestionAndResponseFromMemory(questionId);
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

  /**
   * Get save status for any question type
   */
  getSaveStatus(questionId: string): 'draft' | 'saving' | 'saved' {
    return this.responseSaveStatus.get(questionId) || 'saved';
  }

  /**
   * Get multiline text save status for a question (legacy, uses general status)
   */
  getMultilineTextSaveStatus(questionId: string): 'draft' | 'saving' | 'saved' {
    // Use general status, fall back to legacy for backward compatibility
    return this.responseSaveStatus.get(questionId) || this.multilineTextSaveStatus.get(questionId) || 'saved';
  }

  /**
   * Get character count for multiline text question
   */
  getMultilineTextCharCount(questionId: string): number {
    return this.multilineTextCharCounts.get(questionId) || 0;
  }

  /**
   * Get pending multiselect values for a question
   */
  getPendingMultiselectValues(questionId: string): string[] | undefined {
    return this.pendingMultiselectValues.get(questionId);
  }

  /**
   * Handle rating question change with optimistic updates
   * UI updates immediately, backend save is debounced
   */
  handleRatingChange(questionId: string, value: any): void {
    const responseValue = String(value);

    logger.info({
      message: `Rating changed for question ${questionId}: ${responseValue}`,
    });

    // Store the pending value
    this.pendingResponseValues.set(questionId, responseValue);

    // ============================================
    // OPTIMISTIC UPDATE: Update memory immediately
    // ============================================
    const entry = POWERPOD.workbookQuestionsAndResponses?.questionsWithResponses?.get(questionId);
    if (entry) {
      if (entry.response) {
        // Update existing response in memory
        entry.response.quartech_response = responseValue;
      } else {
        // Create a temporary response object for immediate UI feedback
        entry.response = {
          quartech_response: responseValue,
          _quartech_question_value: questionId,
          // Mark as pending save (no ID yet)
          _pendingSave: true,
        };
      }
    }

    // Set status to 'saving' to show indicator
    this.responseSaveStatus.set(questionId, 'saving');

    // Emit event for IMMEDIATE UI update (with saving status)
    this.emit('response-changed', { questionId, value: responseValue, pending: true, status: 'saving' });
    this.emit('save-status-changed', { questionId, status: 'saving' });

    // ============================================
    // DEBOUNCED BACKEND SAVE
    // ============================================
    // Clear any existing debounce timer for this question
    const existingTimer = this.responseSaveDebounceTimers.get(questionId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set a new debounce timer (1000ms delay for backend save)
    const timer = window.setTimeout(() => {
      this.saveDebouncedResponse(questionId);
    }, 1000);

    this.responseSaveDebounceTimers.set(questionId, timer);
  }

  /**
   * Handle multi-select question change with optimistic updates
   * UI updates immediately, backend save is debounced
   */
  handleMultiselectChange(questionId: string, option: string, isChecked: boolean, validOptions: string[]): void {
    logger.info({
      message: `Multi-select option changed for question ${questionId}: ${option} = ${isChecked}`,
    });

    // Get current pending value or existing response
    let selectedOptions: string[];
    if (this.pendingMultiselectValues.has(questionId)) {
      selectedOptions = this.pendingMultiselectValues.get(questionId)!;
    } else {
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
    }

    // Update the selected options based on checkbox state
    if (isChecked) {
      if (!selectedOptions.includes(option)) {
        selectedOptions.push(option);
      }
    } else {
      selectedOptions = selectedOptions.filter((opt: string) => opt !== option);
    }

    // Store the pending value
    this.pendingMultiselectValues.set(questionId, selectedOptions);

    // ============================================
    // OPTIMISTIC UPDATE: Update memory immediately
    // ============================================
    const responseValue = selectedOptions.join(';');
    const entry = POWERPOD.workbookQuestionsAndResponses?.questionsWithResponses?.get(questionId);
    if (entry) {
      if (entry.response) {
        entry.response.quartech_response = responseValue;
      } else {
        entry.response = {
          quartech_response: responseValue,
          _quartech_question_value: questionId,
          _pendingSave: true,
        };
      }
    }

    // Set status to 'saving' to show indicator
    this.responseSaveStatus.set(questionId, 'saving');

    // Emit event for IMMEDIATE UI update (with saving status)
    this.emit('response-changed', { questionId, value: responseValue, pending: true, status: 'saving' });
    this.emit('save-status-changed', { questionId, status: 'saving' });

    // ============================================
    // DEBOUNCED BACKEND SAVE
    // ============================================
    // Clear any existing debounce timer for this question
    const existingTimer = this.responseSaveDebounceTimers.get(questionId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set a new debounce timer (2000ms delay for backend save)
    const timer = window.setTimeout(() => {
      this.saveMultiselectResponse(questionId);
    }, 2000);

    this.responseSaveDebounceTimers.set(questionId, timer);
  }

  /**
   * Handle multiline text input with debouncing
   */
  handleMultilineTextInput(questionId: string, value: string): void {
    logger.info({
      message: `Multiline text input for question ${questionId}`,
    });

    // Update character count immediately (no debounce)
    this.multilineTextCharCounts.set(questionId, value.length);

    // Store the pending value
    this.pendingResponseValues.set(questionId, value);

    // Update status to draft (use unified status)
    this.responseSaveStatus.set(questionId, 'draft');
    this.multilineTextSaveStatus.set(questionId, 'draft'); // Keep legacy for backward compat

    // Emit event for UI update
    this.emit('multiline-text-status-changed', { questionId, status: 'draft', charCount: value.length });
    this.emit('save-status-changed', { questionId, status: 'draft' });

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
  }

  /**
   * Force save any question type (when user clicks the status indicator)
   */
  async forceSave(questionId: string): Promise<void> {
    const status = this.responseSaveStatus.get(questionId);

    // Only allow force save if status is 'saving' (debounce pending)
    if (status !== 'saving' && status !== 'draft') {
      return;
    }

    logger.info({
      message: `Force saving response for question ${questionId}`,
    });

    // Clear any existing debounce timer
    const existingTimer = this.responseSaveDebounceTimers.get(questionId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.responseSaveDebounceTimers.delete(questionId);
    }

    // Check if it's a multiselect or regular response
    if (this.pendingMultiselectValues.has(questionId)) {
      await this.saveMultiselectResponse(questionId);
    } else if (this.pendingResponseValues.has(questionId)) {
      // Check if it's multiline text (has char count) or rating
      if (this.multilineTextCharCounts.has(questionId)) {
        await this.saveMultilineTextResponse(questionId);
      } else {
        await this.saveDebouncedResponse(questionId);
      }
    }
  }

  /**
   * Force save multiline text (when user clicks the status indicator)
   * @deprecated Use forceSave() instead
   */
  async forceSaveMultilineText(questionId: string): Promise<void> {
    const status = this.multilineTextSaveStatus.get(questionId) || this.responseSaveStatus.get(questionId);

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
  }

  /**
   * Save the debounced response (for rating questions and other text-based responses)
   */
  private async saveDebouncedResponse(questionId: string): Promise<void> {
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
      const responseData = await this.saveRatingResponse(questionId, responseValue);

      // Update the questionnaire store with the full response data
      updateQuestionResponse(questionId, responseValue, undefined, responseData);

      // Update status to 'saved'
      this.responseSaveStatus.set(questionId, 'saved');

      // Emit events for UI update
      this.emit('response-saved', { questionId, responseData });
      this.emit('save-status-changed', { questionId, status: 'saved' });

      logger.info({
        message: `Successfully saved debounced response for question ${questionId}`,
      });

      // Clean up
      this.pendingResponseValues.delete(questionId);
      this.responseSaveDebounceTimers.delete(questionId);
    } catch (error) {
      logger.error({
        message: `Failed to save debounced response: ${(error as Error).message}`,
      });
      // Revert status to 'saving' to indicate it's still pending
      this.responseSaveStatus.set(questionId, 'saving');
      this.emit('save-status-changed', { questionId, status: 'saving', error: true });
      // Don't delete pending value on error, so user can retry
    }
  }

  /**
   * Save the debounced multi-select response
   */
  private async saveMultiselectResponse(questionId: string): Promise<void> {
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
      updateQuestionResponse(questionId, newValue, undefined, responseData);

      // Update status to 'saved'
      this.responseSaveStatus.set(questionId, 'saved');

      // Emit events for UI update
      this.emit('response-saved', { questionId, responseData });
      this.emit('save-status-changed', { questionId, status: 'saved' });

      logger.info({
        message: `Successfully saved multi-select response for question ${questionId}`,
      });

      // Clean up
      this.pendingMultiselectValues.delete(questionId);
      this.responseSaveDebounceTimers.delete(questionId);
    } catch (error) {
      logger.error({
        message: `Failed to save multi-select response: ${(error as Error).message}`,
      });
      // Revert status to 'saving' to indicate it's still pending
      this.responseSaveStatus.set(questionId, 'saving');
      this.emit('save-status-changed', { questionId, status: 'saving', error: true });
      // Don't delete pending value on error, so user can retry
    }
  }

  /**
   * Save the multiline text response
   */
  private async saveMultilineTextResponse(questionId: string): Promise<void> {
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

      // Update status to saving (both unified and legacy)
      this.responseSaveStatus.set(questionId, 'saving');
      this.multilineTextSaveStatus.set(questionId, 'saving');
      this.emit('multiline-text-status-changed', { questionId, status: 'saving' });
      this.emit('save-status-changed', { questionId, status: 'saving' });

      // Save the response
      const responseData = await this.saveRatingResponse(questionId, responseValue);

      // Update the questionnaire store with the full response data
      updateQuestionResponse(questionId, responseValue, true, responseData);

      // Emit event for UI update
      this.emit('response-saved', { questionId, responseData });

      logger.info({
        message: `Successfully saved multiline text response for question ${questionId}`,
      });

      // Update status to saved (both unified and legacy)
      this.responseSaveStatus.set(questionId, 'saved');
      this.multilineTextSaveStatus.set(questionId, 'saved');
      this.emit('multiline-text-status-changed', { questionId, status: 'saved' });
      this.emit('save-status-changed', { questionId, status: 'saved' });

      // Clean up
      this.pendingResponseValues.delete(questionId);
      this.responseSaveDebounceTimers.delete(questionId);
    } catch (error) {
      logger.error({
        message: `Failed to save multiline text response: ${(error as Error).message}`,
      });
      // Revert status to draft on error (both unified and legacy)
      this.responseSaveStatus.set(questionId, 'draft');
      this.multilineTextSaveStatus.set(questionId, 'draft');
      this.emit('multiline-text-status-changed', { questionId, status: 'draft' });
      this.emit('save-status-changed', { questionId, status: 'draft', error: true });
      // Don't delete pending value on error, so user can retry
    }
  }

  /**
   * Build rating description for Point Rating questions
   */
  private buildRatingDescription(questionId: string, ratingValue: any): string | null {
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

  /**
   * Save rating response (core save method)
   */
  private async saveRatingResponse(questionId: string, ratingValue: any): Promise<any> {
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
        // Create new response
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
          quartech_workbookresponseid: createResult.response?.quartech_workbookresponseid,
          quartech_response: responseText,
          quartech_notes: notes,
          quartech_description: description,
          _quartech_question_value: questionId,
          _quartech_workbook_value: workbookId,
          createdon: createResult.response?.createdon || new Date().toISOString(),
          modifiedon: createResult.response?.modifiedon || new Date().toISOString(),
        };

        // CRITICAL: Update memory structures IMMEDIATELY after creation
        this.updateMemoryStructuresForRating(questionId, responseData, true);
      }

      // Update memory structures for updates (for creates, already done above)
      if (!isNewResponse) {
        this.updateMemoryStructuresForRating(questionId, responseData, false);
      }

      // Return the response data for use in questionnaire store
      return responseData;
    } catch (error) {
      logger.error({
        message: `Failed to save rating response: ${String(error)}`,
      });
      throw error;
    }
  }

  /**
   * Update memory structures for rating responses
   */
  private updateMemoryStructuresForRating(
    questionId: string,
    responseData: any,
    isNewResponse: boolean
  ): void {
    try {
      // Update new nested structure using helper function
      WorkbookResponseHelper.updateResponseInMemory(questionId, responseData);

      // Update old structure for backward compatibility
      POWERPOD.workbookResponses.responsesByQuestion.set(questionId, responseData);

      if (isNewResponse) {
        // Add to beginning of data array (most recent first)
        POWERPOD.workbookResponses.data.unshift(responseData);
      } else {
        // Update existing entry in data array
        const dataIndex = POWERPOD.workbookResponses.data.findIndex(
          (r: any) =>
            r.quartech_workbookresponseid === responseData.quartech_workbookresponseid
        );
        if (dataIndex !== -1) {
          POWERPOD.workbookResponses.data[dataIndex] = responseData;
        }
      }

      // Update memory metadata for both structures
      POWERPOD.workbookResponses.lastUpdated = new Date().toISOString();
      POWERPOD.workbookQuestionsAndResponses.lastUpdated = new Date().toISOString();
    } catch (error) {
      logger.error({
        message: `Failed to update memory structures for rating: ${String(error)}`,
      });
      // Don't throw - this is a memory update issue, not a save issue
    }
  }
}
