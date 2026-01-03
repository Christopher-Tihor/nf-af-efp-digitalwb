import { Logger } from '../common/logger.js';
import { POWERPOD } from '../common/constants.js';
import { getWorkbookId } from '../common/workbookUtils.js';
import { getChapterFromStore } from '../common/questionnaire.js';
import WorkbookResponseHelper from '../common/workbookResponseHelper.js';

const logger = Logger('services/ChapterManagementService');

/**
 * Service responsible for managing chapter-level operations
 * Handles chapter skipping, completion tracking, and validation
 */
export class ChapterManagementService {
  // Event listeners for state changes
  private eventListeners: Map<string, Set<Function>> = new Map();

  // Track in-flight skip operations to prevent race conditions
  private pendingSkipOperations: Map<string, { isSkipped: boolean; abortController: AbortController }> = new Map();

  constructor() {
    logger.info({ message: 'ChapterManagementService initialized' });
  }

  /**
   * Clean up all state
   */
  cleanup(): void {
    // Abort any pending operations
    this.pendingSkipOperations.forEach((op) => op.abortController.abort());
    this.pendingSkipOperations.clear();
    this.eventListeners.clear();
    logger.info({ message: 'ChapterManagementService cleaned up' });
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
   * Check if a chapter is skipped
   * A chapter is skipped if ALL its questions have quartech_chapterskipped === 100000000
   */
  isChapterSkipped(chapterId: string): boolean {
    const chapter = getChapterFromStore(chapterId) as any;
    const questions = this.getQuestionsForChapter(chapterId, true); // Exclude preventSkipping subchapters

    console.log('[isChapterSkipped] DEBUG:', {
      chapterId,
      chapterFound: !!chapter,
      chapterName: chapter?.name || chapter?.label || 'unknown',
      questionsCount: questions.length,
      mapSize: POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.size,
      isLoaded: POWERPOD.workbookQuestionsAndResponses.isLoaded,
      subchaptersCount: chapter?.subchapters?.length || 0
    });

    if (questions.length === 0) {
      console.log('[isChapterSkipped] No questions found for chapter, returning FALSE', { chapterId });
      return false;
    }

    // Check if ALL questions have quartech_chapterskipped set to YES (100000000)
    let allSkipped = true;
    for (const q of questions) {
      const entry = POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.get(q.id);
      const isSkipped = entry?.response?.quartech_chapterskipped === 100000000;

      console.log('[isChapterSkipped] Question check:', {
        questionId: q.id,
        questionName: q.name || q.label,
        entryExists: !!entry,
        responseExists: !!entry?.response,
        chapterSkippedValue: entry?.response?.quartech_chapterskipped,
        isSkipped
      });

      if (!isSkipped) {
        allSkipped = false;
        // Continue to log all questions for debugging
      }
    }

    console.log('[isChapterSkipped] Final result:', { chapterId, result: allSkipped, questionsChecked: questions.length });

    return allSkipped;
  }

  /**
   * Check if skipping is prevented for a chapter
   * quartech_preventskipping is an Int32 field: 100000000 = Yes, 100000001 = No
   */
  isSkippingPrevented(chapterId: string): boolean {
    const chapter = getChapterFromStore(chapterId) as any;
    if (!chapter) return false;

    // Check chapter-level preventSkipping field
    // Handle both raw integer value (100000000) and mapped boolean (preventSkipping: true)
    const YES_VALUE = 100000000;
    if (chapter.quartech_preventskipping === YES_VALUE ||
        chapter.preventSkipping === true) {
      return true;
    }

    // Check if parent chapter has preventSkipping enabled (cascades down)
    if (chapter.parentChapterId || chapter._quartech_parentchapter_value) {
      const parentId = chapter.parentChapterId || chapter._quartech_parentchapter_value;
      return this.isSkippingPrevented(parentId);
    }

    return false;
  }

  /**
   * Check if a subchapter has preventSkipping enabled
   * Handles both raw integer value and mapped boolean
   */
  private hasPreventSkipping(subchapter: any): boolean {
    const YES_VALUE = 100000000;
    return subchapter.quartech_preventskipping === YES_VALUE ||
           subchapter.preventSkipping === true;
  }

  /**
   * Get all questions for a chapter (including subchapters)
   * @param excludePreventSkipping - If true, exclude questions from subchapters with preventSkipping enabled
   */
  getQuestionsForChapter(chapterId: string, excludePreventSkipping: boolean = false): any[] {
    const chapter = getChapterFromStore(chapterId) as any;
    if (!chapter) return [];

    let questions: any[] = [...(chapter.questions || [])];

    // Also collect questions from subchapters
    if (chapter.subchapters) {
      const collectQuestionsFromSubchapters = (subchapters: any[]) => {
        for (const subchapter of subchapters) {
          // Skip if preventSkipping is enabled and we're excluding those
          if (excludePreventSkipping && this.hasPreventSkipping(subchapter)) {
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

  /**
   * Handle chapter skipped checkbox change
   * Updates all questions in the chapter with the skipped status
   */
  async handleChapterSkippedChange(chapterId: string, isSkipped: boolean): Promise<void> {
    // ============================================
    // RACE CONDITION PREVENTION
    // Cancel any pending operation for this chapter
    // ============================================
    const pendingOp = this.pendingSkipOperations.get(chapterId);
    if (pendingOp) {
      logger.info({
        message: `Cancelling pending skip operation for chapter ${chapterId}`,
        data: { previousIsSkipped: pendingOp.isSkipped, newIsSkipped: isSkipped },
      });
      pendingOp.abortController.abort();
      this.pendingSkipOperations.delete(chapterId);
    }

    // Create new abort controller for this operation
    const abortController = new AbortController();
    this.pendingSkipOperations.set(chapterId, { isSkipped, abortController });

    try {
      logger.info({
        message: `Chapter ${chapterId} skipped status changing to: ${isSkipped}`,
      });

      // When skipping, exclude questions from subchapters that have preventSkipping enabled
      // When unskipping, include all questions to restore their state
      const excludePreventSkipping = isSkipped;
      const questions = this.getQuestionsForChapter(chapterId, excludePreventSkipping);

      if (questions.length === 0) {
        logger.warn({
          message: 'Cannot update chapter skipped: no questions found (or all are in prevent-skipping subchapters)',
          data: { chapterId, excludePreventSkipping },
        });
        this.pendingSkipOperations.delete(chapterId);
        return;
      }

      const workbookId = getWorkbookId();
      if (!workbookId) {
        logger.error({
          message: 'Cannot update chapter skipped: no workbook ID found',
        });
        this.pendingSkipOperations.delete(chapterId);
        return;
      }

      // Set quartech_chapterskipped to YES (100000000) if checked, NO (100000001) if unchecked
      const chapterSkippedValue = isSkipped ? 100000000 : 100000001;

      logger.info({
        message: `Updating chapter skipped status for ${questions.length} questions`,
        data: { chapterId, isSkipped, chapterSkippedValue, questionCount: questions.length },
      });

      // ============================================
      // OPTIMISTIC UPDATE: Update memory immediately
      // ============================================
      const previousStates: Map<string, { skipped: number | undefined, response: string | undefined, hadResponse: boolean }> = new Map();

      for (const question of questions) {
        const questionId = question.id;
        const entry = POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.get(questionId);

        if (entry) {
          if (entry.response) {
            // Save previous state for rollback
            previousStates.set(questionId, {
              skipped: entry.response.quartech_chapterskipped,
              response: entry.response.quartech_response,
              hadResponse: true,
            });

            // Optimistically update in memory
            entry.response.quartech_chapterskipped = chapterSkippedValue;
            if (isSkipped) {
              entry.response.quartech_response = '';
            }
          } else {
            // Create a temporary response object for immediate UI feedback
            // This ensures the skipped status is reflected in the nav menu immediately
            previousStates.set(questionId, {
              skipped: undefined,
              response: undefined,
              hadResponse: false,
            });

            entry.response = {
              quartech_response: '',
              quartech_chapterskipped: chapterSkippedValue,
              _quartech_question_value: questionId,
              // Mark as pending save (no ID yet)
              _pendingSave: true,
            };
          }
        }
      }

      // Emit event for IMMEDIATE UI update (before backend completes)
      this.emit('chapter-skipped-changed', { chapterId, isSkipped });

      // ============================================
      // BACKEND UPDATE: Save to server in background
      // Use Promise.allSettled to handle partial failures gracefully
      // ============================================
      const updatePromises = questions.map(async (question) => {
        // Check if operation was aborted
        if (abortController.signal.aborted) {
          throw new Error('Operation aborted');
        }

        const questionId = question.id;
        const prevState = previousStates.get(questionId);

        // Check if there was a real response before (with an ID in the backend)
        // We now create temporary responses optimistically, so we check hadResponse flag
        if (prevState?.hadResponse) {
          const entry = POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.get(questionId);
          const responseId = entry?.response?.quartech_workbookresponseid;
          await POWERPOD.fetch.patchWorkbookResponseData({
            id: responseId,
            chapterSkipped: chapterSkippedValue,
            response: isSkipped ? '' : (prevState.response || ''),
          });
          return { questionId, success: true };
        } else {
          // If no response existed before, create one with chapterSkipped set
          const result = await WorkbookResponseHelper.createResponse(questionId, '', {
            chapterSkipped: chapterSkippedValue,
          });
          // Update the temporary response with the real ID from the backend
          const entry = POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.get(questionId);
          if (entry?.response && result?.responseId) {
            entry.response.quartech_workbookresponseid = result.responseId;
            delete entry.response._pendingSave;
          }
          return { questionId, success: true };
        }
      });

      // Wait for all backend updates using allSettled
      const results = await Promise.allSettled(updatePromises);

      // Check if operation was aborted during execution
      if (abortController.signal.aborted) {
        logger.info({
          message: `Skip operation for chapter ${chapterId} was aborted`,
        });
        return;
      }

      // Check for failures
      const failures = results.filter(r => r.status === 'rejected');
      const successes = results.filter(r => r.status === 'fulfilled');

      if (failures.length > 0) {
        logger.error({
          message: `${failures.length}/${questions.length} updates failed for chapter ${chapterId}`,
          data: { failures: failures.map(f => (f as PromiseRejectedResult).reason?.message) },
        });

        // Rollback memory state for failed questions
        for (const question of questions) {
          const questionId = question.id;
          const prevState = previousStates.get(questionId);
          const entry = POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.get(questionId);

          if (prevState && entry) {
            if (!prevState.hadResponse) {
              // Remove the temporary response we created
              entry.response = undefined;
            } else if (entry.response) {
              // Restore previous state
              entry.response.quartech_chapterskipped = prevState.skipped;
              if (prevState.response !== undefined) {
                entry.response.quartech_response = prevState.response;
              }
            }
          }
        }

        // Emit rollback event to refresh UI from actual memory state
        this.emit('chapter-skipped-changed', { chapterId, isSkipped: !isSkipped, rollback: true });
        throw new Error(`Failed to update ${failures.length} questions`);
      }

      logger.info({
        message: `Successfully updated chapter ${chapterId} skipped status to: ${isSkipped}`,
        data: { successCount: successes.length },
      });

    } catch (error) {
      if ((error as Error).message === 'Operation aborted') {
        logger.info({
          message: `Skip operation for chapter ${chapterId} was aborted by newer operation`,
        });
        return;
      }
      logger.error({
        message: `Failed to update chapter skipped status: ${(error as Error).message}`,
      });
      throw error;
    } finally {
      // Clean up pending operation tracker
      if (this.pendingSkipOperations.get(chapterId)?.abortController === abortController) {
        this.pendingSkipOperations.delete(chapterId);
      }
    }
  }

  /**
   * Get chapter completion status
   */
  getChapterCompletionStatus(chapterId: string): {
    totalQuestions: number;
    answeredQuestions: number;
    isComplete: boolean;
    isSkipped: boolean;
  } {
    const isSkipped = this.isChapterSkipped(chapterId);
    const questions = this.getQuestionsForChapter(chapterId);
    const totalQuestions = questions.length;

    let answeredQuestions = 0;
    questions.forEach((question: any) => {
      const questionId = question.id || question.quartech_questionid;
      const entry = POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.get(questionId);
      const response = entry?.response;

      // Question is answered if it has a non-empty response OR if it's skipped
      if (response?.quartech_chapterskipped === 100000000) {
        // Question is skipped, count as answered
        answeredQuestions++;
      } else if (response?.quartech_response && response.quartech_response.trim() !== '') {
        // Question has a response
        answeredQuestions++;
      }
    });

    // Chapter is complete if:
    // 1. The entire chapter is skipped, OR
    // 2. All questions are answered/skipped, OR
    // 3. Chapter has no questions (empty container chapter)
    const isComplete = isSkipped || answeredQuestions === totalQuestions || totalQuestions === 0;

    return {
      totalQuestions,
      answeredQuestions,
      isComplete,
      isSkipped,
    };
  }
}

