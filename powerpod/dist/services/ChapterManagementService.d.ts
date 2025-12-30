/**
 * Service responsible for managing chapter-level operations
 * Handles chapter skipping, completion tracking, and validation
 */
export declare class ChapterManagementService {
    private eventListeners;
    private pendingSkipOperations;
    constructor();
    /**
     * Clean up all state
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
     * Check if a chapter is skipped
     * A chapter is skipped if ALL its questions have quartech_chapterskipped === 100000000
     */
    isChapterSkipped(chapterId: string): boolean;
    /**
     * Check if skipping is prevented for a chapter
     * quartech_preventskipping is an Int32 field: 100000000 = Yes, 100000001 = No
     */
    isSkippingPrevented(chapterId: string): boolean;
    /**
     * Check if a subchapter has preventSkipping enabled
     * Handles both raw integer value and mapped boolean
     */
    private hasPreventSkipping;
    /**
     * Get all questions for a chapter (including subchapters)
     * @param excludePreventSkipping - If true, exclude questions from subchapters with preventSkipping enabled
     */
    getQuestionsForChapter(chapterId: string, excludePreventSkipping?: boolean): any[];
    /**
     * Handle chapter skipped checkbox change
     * Updates all questions in the chapter with the skipped status
     */
    handleChapterSkippedChange(chapterId: string, isSkipped: boolean): Promise<void>;
    /**
     * Get chapter completion status
     */
    getChapterCompletionStatus(chapterId: string): {
        totalQuestions: number;
        answeredQuestions: number;
        isComplete: boolean;
        isSkipped: boolean;
    };
}
