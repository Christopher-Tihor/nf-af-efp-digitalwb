/**
 * Load questionnaire data into the store from the nested chapter structure
 * @param {Array} nestedChapterStructure - The nested chapter structure from the API
 * @param {boolean} forceRefresh - Whether to force refresh the data
 * @param {Object} responseData - Optional response data to merge with questions
 * @returns {Object} The questionnaire data
 */
export function loadQuestionnaireIntoStore(nestedChapterStructure: any[], forceRefresh?: boolean, responseData?: Object): Object;
/**
 * Get questionnaire data from store
 * @returns {Object|null} The questionnaire data or null if not loaded
 */
export function getQuestionnaireFromStore(): Object | null;
/**
 * Get a specific chapter by ID from the store
 * @param {string} chapterId - The chapter ID to find
 * @returns {Object|null} The chapter object or null if not found
 */
export function getChapterFromStore(chapterId: string): Object | null;
/**
 * Get a specific question by ID from the store
 * @param {string} questionId - The question ID to find
 * @returns {Object|null} The question object or null if not found
 */
export function getQuestionFromStore(questionId: string): Object | null;
/**
 * Update a chapter's completion status
 * @param {string} chapterId - The chapter ID to update
 * @param {boolean} complete - The completion status
 */
export function updateChapterCompletion(chapterId: string, complete: boolean): void;
/**
 * Update a question's response
 * @param {string} questionId - The question ID to update
 * @param {any} response - The response value
 * @param {boolean} complete - Whether the question is complete (optional, auto-calculated if not provided)
 * @param {Object} responseData - Full response data object (optional)
 */
export function updateQuestionResponse(questionId: string, response: any, complete?: boolean, responseData?: Object): void;
/**
 * Get all questions for a specific chapter
 * @param {string} chapterId - The chapter ID
 * @returns {Array} Array of questions for the chapter
 */
export function getQuestionsForChapter(chapterId: string): any[];
/**
 * Get completion statistics for the questionnaire
 * @returns {Object} Statistics about questionnaire completion
 */
export function getQuestionnaireStats(): Object;
/**
 * Load questionnaire data with responses into the store
 * @param {Array} nestedChapterStructure - The nested chapter structure from the API
 * @param {string} workbookId - The workbook ID to load responses for
 * @param {boolean} forceRefresh - Whether to force refresh the data
 * @returns {Promise<Object>} The questionnaire data with responses
 */
export function loadQuestionnaireWithResponses(nestedChapterStructure: any[], workbookId: string, forceRefresh?: boolean): Promise<Object>;
/**
 * Refresh questionnaire store with latest response data
 * @param {string} workbookId - The workbook ID to refresh responses for
 * @returns {Promise<boolean>} True if refresh was successful
 */
export function refreshQuestionnaireResponses(workbookId: string): Promise<boolean>;
/**
 * Calculate completion status for a chapter based on questionnaire store rules
 * @param {Object} chapter - The chapter object
 * @returns {boolean} True if the chapter should be marked complete
 */
export function calculateChapterCompletion(chapter: Object): boolean;
/**
 * Update completion status for all chapters in the questionnaire store
 * This applies the completion rules recursively to all chapters and subchapters
 */
export function updateQuestionnaireCompletion(): number | undefined;
/**
 * Check if questionnaire data is loaded in the store
 * @returns {boolean} True if questionnaire data is loaded
 */
export function isQuestionnaireLoaded(): boolean;
