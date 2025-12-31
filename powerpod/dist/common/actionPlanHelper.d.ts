/**
 * Get action plans from store (cached)
 * @returns {Object} The action plans state { isLoaded: boolean, plans: Array }
 */
export function getActionPlansFromStore(): Object;
/**
 * Check if action plans are loaded in store
 * @returns {boolean} Whether action plans are loaded
 */
export function areActionPlansLoaded(): boolean;
/**
 * Get action plans for a specific workbook from store
 * @param {string} workbookId - The workbook ID to filter by
 * @returns {Array} Array of action plans for the workbook
 */
export function getActionPlansForWorkbook(workbookId: string): any[];
/**
 * Get action plans for a specific question from store
 * @param {string} questionId - The question ID to filter by
 * @returns {Array} Array of action plans for the question
 */
export function getActionPlansForQuestion(questionId: string): any[];
/**
 * Load action plans into store from API
 * Only fetches from API if not already loaded (unless forceRefresh is true)
 * @param {boolean} forceRefresh - Force refresh from API even if already loaded
 * @returns {Promise<Array>} Array of action plans
 */
export function loadActionPlansIntoStore(forceRefresh?: boolean): Promise<any[]>;
/**
 * Add a new action plan to the store (after API creation)
 * @param {Object} actionPlan - The action plan to add
 */
export function addActionPlanToStore(actionPlan: Object): void;
/**
 * Update an action plan in the store (after API update)
 * @param {string} actionPlanId - The ID of the action plan to update
 * @param {Object} updates - The updates to apply
 */
export function updateActionPlanInStore(actionPlanId: string, updates: Object): void;
/**
 * Remove an action plan from the store (after API deletion)
 * @param {string} actionPlanId - The ID of the action plan to remove
 */
export function removeActionPlanFromStore(actionPlanId: string): void;
/**
 * Refresh action plans in store from API
 * Always fetches from API regardless of cache state
 * @returns {Promise<Array>} Array of action plans
 */
export function refreshActionPlansInStore(): Promise<any[]>;
/**
 * Get all action plans
 * @returns {Promise<Object>} Action plans data
 */
export function getActionPlans(): Promise<Object>;
/**
 * Create a new action plan
 * @param {string} workbookId - The workbook ID
 * @param {string} action - The action text
 * @param {string} [chapterId] - Optional chapter ID
 * @param {string} [questionId] - Optional question ID
 * @returns {Promise<Object>} Result of the creation
 */
export function createActionPlan(workbookId: string, action: string, chapterId?: string | undefined, questionId?: string | undefined): Promise<Object>;
export default ActionPlanHelper;
declare namespace ActionPlanHelper {
    export { getActionPlans };
    export { createActionPlan };
    export { getActionPlansFromStore };
    export { areActionPlansLoaded };
    export { getActionPlansForWorkbook };
    export { getActionPlansForQuestion };
    export { loadActionPlansIntoStore };
    export { addActionPlanToStore };
    export { updateActionPlanInStore };
    export { removeActionPlanFromStore };
    export { refreshActionPlansInStore };
    export { createTest };
    export { createMultiple };
    export { getAll };
}
/**
 * Create a test action plan with current workbook
 * Usage: POWERPOD.actionPlanHelper.createTest("My action item")
 */
declare function createTest(action: any, chapterId?: null, questionId?: null): Promise<Object | undefined>;
/**
 * Create multiple test action plans
 * Usage: POWERPOD.actionPlanHelper.createMultiple(["Action 1", "Action 2", "Action 3"])
 */
declare function createMultiple(actions: any, chapterId?: null, questionId?: null): Promise<Object[] | undefined>;
/**
 * Get all action plans
 * Usage: POWERPOD.actionPlanHelper.getAll()
 */
declare function getAll(): Promise<Object>;
