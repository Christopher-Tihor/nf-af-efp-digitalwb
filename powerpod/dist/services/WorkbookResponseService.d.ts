/**
 * Service responsible for managing workbook responses
 * Handles CRUD operations, debouncing, and state synchronization
 */
export declare class WorkbookResponseService {
    private responseSaveDebounceTimers;
    private pendingResponseValues;
    private pendingMultiselectValues;
    private responseSaveStatus;
    private multilineTextSaveStatus;
    private multilineTextCharCounts;
    private eventListeners;
    constructor();
    /**
     * Clean up all pending timers and state
     */
    cleanup(): void;
    /**
     * Subscribe to service events
     */
    on(event: string, callback: Function): void;
    /**
     * Unsubscribe from service events
     */
    off(event: string, callback: Function): void;
    /**
     * Emit an event to all listeners
     */
    private emit;
    /**
     * Get response for a specific question
     */
    getResponseForQuestion(questionId: string): any | null;
    /**
     * Get question data for a specific question
     */
    getQuestionForQuestion(questionId: string): any | null;
    /**
     * Get both question and response data
     */
    getQuestionAndResponse(questionId: string): {
        question: any | null;
        response: any | null;
    };
    /**
     * Get save status for any question type
     */
    getSaveStatus(questionId: string): 'draft' | 'saving' | 'saved';
    /**
     * Get multiline text save status for a question (legacy, uses general status)
     */
    getMultilineTextSaveStatus(questionId: string): 'draft' | 'saving' | 'saved';
    /**
     * Get character count for multiline text question
     */
    getMultilineTextCharCount(questionId: string): number;
    /**
     * Get pending multiselect values for a question
     */
    getPendingMultiselectValues(questionId: string): string[] | undefined;
    /**
     * Handle rating question change with optimistic updates
     * UI updates immediately, backend save is debounced
     */
    handleRatingChange(questionId: string, value: any): void;
    /**
     * Handle multi-select question change with optimistic updates
     * UI updates immediately, backend save is debounced
     */
    handleMultiselectChange(questionId: string, option: string, isChecked: boolean, validOptions: string[]): void;
    /**
     * Handle multiline text input with debouncing
     */
    handleMultilineTextInput(questionId: string, value: string): void;
    /**
     * Force save any question type (when user clicks the status indicator)
     */
    forceSave(questionId: string): Promise<void>;
    /**
     * Force save multiline text (when user clicks the status indicator)
     * @deprecated Use forceSave() instead
     */
    forceSaveMultilineText(questionId: string): Promise<void>;
    /**
     * Save the debounced response (for rating questions and other text-based responses)
     */
    private saveDebouncedResponse;
    /**
     * Save the debounced multi-select response
     */
    private saveMultiselectResponse;
    /**
     * Save the multiline text response
     */
    private saveMultilineTextResponse;
    /**
     * Build rating description for Point Rating questions
     */
    private buildRatingDescription;
    /**
     * Save rating response (core save method)
     */
    private saveRatingResponse;
    /**
     * Update memory structures for rating responses
     */
    private updateMemoryStructuresForRating;
}
