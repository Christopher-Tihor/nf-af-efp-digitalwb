/**
 * Load question response configurations from the API
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Object containing configurations organized by question ID
 */
export function loadQuestionResponseConfigurations(options?: Object): Promise<Object>;
/**
 * Get configurations for a specific question
 * @param {string} questionId - The question ID
 * @returns {Array} Array of configurations for the question
 */
export function getConfigurationsForQuestion(questionId: string): any[];
/**
 * Check if configurations are loaded
 * @returns {boolean} True if configurations are loaded
 */
export function isConfigurationsLoaded(): boolean;
/**
 * Clear configurations from memory
 */
export function clearConfigurations(): void;
/**
 * Merge question response configurations into the nested chapter structure
 * @param {Array} nestedChapterStructure - The nested chapter structure
 * @param {Map} configsByQuestion - Map of question IDs to their configurations
 * @returns {Array} Enhanced structure with configuration data
 */
export function mergeConfigurationsWithQuestions(nestedChapterStructure: any[], configsByQuestion: Map<any, any>): any[];
/**
 * Load configurations and merge them into the questionnaire store
 * @param {Array} nestedChapterStructure - The nested chapter structure
 * @param {Object} options - Fetch options
 * @returns {Promise<Array>} Enhanced structure with configuration data
 */
export function loadAndMergeConfigurations(nestedChapterStructure: any[], options?: Object): Promise<any[]>;
export default QuestionResponseConfigHelper;
declare namespace QuestionResponseConfigHelper {
    export { loadQuestionResponseConfigurations };
    export { getConfigurationsForQuestion };
    export { isConfigurationsLoaded };
    export { clearConfigurations };
    export { mergeConfigurationsWithQuestions };
    export { loadAndMergeConfigurations };
}
