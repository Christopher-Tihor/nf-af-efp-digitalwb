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
}
