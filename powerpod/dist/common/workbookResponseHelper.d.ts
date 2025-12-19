/**
 * Get chapterId for a given questionId
 * @param {string} questionId - The question ID
 * @returns {string|null} The chapter ID or null if not found
 */
export function getChapterIdForQuestion(questionId: string): string | null;
/**
 * Fetch all responses for a specific workbook
 * @param {string} workbookId - The workbook ID
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} Response data with metadata
 */
export function getResponsesForWorkbook(workbookId: string, options?: Object): Promise<Object>;
/**
 * Fetch responses for a specific workbook and question
 * @param {string} workbookId - The workbook ID
 * @param {string} questionId - The question ID
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} Response data with metadata
 */
export function getResponsesForWorkbookAndQuestion(workbookId: string, questionId: string, options?: Object): Promise<Object>;
/**
 * Create a new workbook response
 * @param {string} questionId - The question ID
 * @param {string} response - The response text
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} Created response data
 */
export function createResponse(questionId: string, response: string, options?: Object): Promise<Object>;
/**
 * Update an existing workbook response
 * @param {string} responseId - The response ID to update
 * @param {string} response - The new response text (optional)
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} Update result
 */
export function updateResponse(responseId: string, response?: string, options?: Object): Promise<Object>;
/**
 * Delete a workbook response
 * @param {string} responseId - The response ID to delete
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} Delete result
 */
export function deleteResponse(responseId: string, options?: Object): Promise<Object>;
/**
 * Get the most recent response for a specific workbook and question
 * @param {string} workbookId - The workbook ID
 * @param {string} questionId - The question ID
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object|null>} Most recent response or null if none found
 */
export function getLatestResponse(workbookId: string, questionId: string, options?: Object): Promise<Object | null>;
/**
 * Check if a response exists for a specific workbook and question
 * @param {string} workbookId - The workbook ID
 * @param {string} questionId - The question ID
 * @param {Object} options - Additional fetch options
 * @returns {Promise<boolean>} True if response exists, false otherwise
 */
export function hasResponse(workbookId: string, questionId: string, options?: Object): Promise<boolean>;
/**
 * Get response statistics for a workbook
 * @param {string} workbookId - The workbook ID
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} Response statistics
 */
export function getResponseStats(workbookId: string, options?: Object): Promise<Object>;
/**
 * Get workbook responses from POWERPOD memory (if loaded)
 * @returns {Object} Workbook responses data from memory
 */
export function getFromMemory(): Object;
/**
 * Get response for a specific question from memory
 * @param {string} questionId - The question ID
 * @returns {Object|null} Response object or null if not found
 */
export function getResponseFromMemory(questionId: string): Object | null;
/**
 * Check if responses are loaded in memory for a specific workbook
 * @param {string} workbookId - The workbook ID to check
 * @returns {boolean} True if responses are loaded for this workbook
 */
export function isLoadedInMemory(workbookId: string): boolean;
/**
 * Clear workbook responses from memory
 */
export function clearMemory(): void;
/**
 * Get memory statistics
 * @returns {Object} Memory usage statistics
 */
export function getMemoryStats(): Object;
/**
 * Load and organize workbook questions and responses into nested structure
 * @param {string} workbookId - The workbook ID
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Organized questions and responses data
 */
export function loadQuestionsAndResponses(workbookId: string, options?: Object): Promise<Object>;
/**
 * Get questions and responses from memory
 * @returns {Object} Questions and responses data from memory
 */
export function getQuestionsAndResponsesFromMemory(): Object;
/**
 * Get question and response data for a specific question
 * @param {string} questionId - The question ID
 * @returns {Object|null} Question and response data or null if not found
 */
export function getQuestionAndResponseFromMemory(questionId: string): Object | null;
/**
 * Get questions and responses for a specific chapter
 * @param {string} chapterId - The chapter ID
 * @returns {Array} Array of question and response objects
 */
export function getChapterQuestionsAndResponsesFromMemory(chapterId: string): any[];
/**
 * Update response in the nested structure
 * @param {string} questionId - The question ID
 * @param {Object} responseData - The response data
 */
export function updateResponseInMemory(questionId: string, responseData: Object): void;
/**
 * Remove response from the nested structure
 * @param {string} questionId - The question ID
 */
export function removeResponseFromMemory(questionId: string): void;
/**
 * Update statistics for questions and responses
 * This function counts both answered and skipped questions as "complete"
 * Completion percentage = (answered + skipped) / total questions
 * A question is considered "answered" if it has a non-empty response value
 * A question is considered "skipped" if quartech_chapterskipped === 100000000
 */
export function updateQuestionsAndResponsesStats(): void;
/**
 * Clear questions and responses from memory
 */
export function clearQuestionsAndResponsesMemory(): void;
export default WorkbookResponseHelper;
declare namespace WorkbookResponseHelper {
    export { getResponsesForWorkbook };
    export { getResponsesForWorkbookAndQuestion };
    export { createResponse };
    export { updateResponse };
    export { deleteResponse };
    export { getLatestResponse };
    export { hasResponse };
    export { getResponseStats };
    export { getFromMemory };
    export { getResponseFromMemory };
    export { isLoadedInMemory };
    export { clearMemory };
    export { getMemoryStats };
    export { loadQuestionsAndResponses };
    export { getQuestionsAndResponsesFromMemory };
    export { getQuestionAndResponseFromMemory };
    export { getChapterQuestionsAndResponsesFromMemory };
    export { updateResponseInMemory };
    export { removeResponseFromMemory };
    export { clearQuestionsAndResponsesMemory };
}
