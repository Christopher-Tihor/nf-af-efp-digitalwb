// @ts-nocheck
import { POWERPOD } from './constants.js';
import { Logger } from './logger.js';
import { getCurrentWorkbookId } from './workbookUtils.js';
import { getActionPlansData, postActionPlanData } from './fetch.js';
import store from '../store/index.js';

const logger = Logger('common/actionPlanHelper');

// ============================================
// Store-based Action Plan Cache Functions
// ============================================

/**
 * Get action plans from store (cached)
 * @returns {Object} The action plans state { isLoaded: boolean, plans: Array }
 */
export function getActionPlansFromStore() {
  return store.state.actionPlans || { isLoaded: false, plans: [] };
}

/**
 * Check if action plans are loaded in store
 * @returns {boolean} Whether action plans are loaded
 */
export function areActionPlansLoaded() {
  return store.state.actionPlans?.isLoaded === true;
}

/**
 * Get action plans for a specific workbook from store
 * @param {string} workbookId - The workbook ID to filter by
 * @returns {Array} Array of action plans for the workbook
 */
export function getActionPlansForWorkbook(workbookId) {
  const { plans } = getActionPlansFromStore();
  if (!workbookId || !plans) return [];
  return plans.filter((plan) => plan._quartech_workbook_value === workbookId);
}

/**
 * Get action plans for a specific question from store
 * @param {string} questionId - The question ID to filter by
 * @returns {Array} Array of action plans for the question
 */
export function getActionPlansForQuestion(questionId) {
  const { plans } = getActionPlansFromStore();
  if (!questionId || !plans) return [];
  return plans.filter((plan) => plan._quartech_workbookquestion_value === questionId);
}

/**
 * Load action plans into store from API
 * Only fetches from API if not already loaded (unless forceRefresh is true)
 * @param {boolean} forceRefresh - Force refresh from API even if already loaded
 * @returns {Promise<Array>} Array of action plans
 */
export async function loadActionPlansIntoStore(forceRefresh = false) {
  // Check if already loaded and not forcing refresh
  if (!forceRefresh && areActionPlansLoaded()) {
    logger.info({
      fn: loadActionPlansIntoStore,
      message: 'Action plans already loaded in store, using cached data',
      data: { count: store.state.actionPlans.plans?.length || 0 },
    });
    return store.state.actionPlans.plans;
  }

  try {
    logger.info({
      fn: loadActionPlansIntoStore,
      message: 'Fetching action plans from API',
      data: { forceRefresh },
    });

    const result = await getActionPlansData();
    const plans = result?.data?.value || [];

    // Store in the centralized store
    store.commit('setActionPlans', { plans });

    logger.info({
      fn: loadActionPlansIntoStore,
      message: 'Action plans loaded into store',
      data: { count: plans.length },
    });

    return plans;
  } catch (error) {
    logger.error({
      fn: loadActionPlansIntoStore,
      message: 'Failed to load action plans into store',
      data: { error },
    });
    throw error;
  }
}

/**
 * Add a new action plan to the store (after API creation)
 * @param {Object} actionPlan - The action plan to add
 */
export function addActionPlanToStore(actionPlan) {
  if (!actionPlan) return;
  store.commit('addActionPlan', { actionPlan });
  logger.info({
    fn: addActionPlanToStore,
    message: 'Action plan added to store',
    data: { actionPlanId: actionPlan.quartech_actionplanid },
  });
}

/**
 * Update an action plan in the store (after API update)
 * @param {string} actionPlanId - The ID of the action plan to update
 * @param {Object} updates - The updates to apply
 */
export function updateActionPlanInStore(actionPlanId, updates) {
  if (!actionPlanId) return;
  store.commit('updateActionPlan', { actionPlanId, updates });
  logger.info({
    fn: updateActionPlanInStore,
    message: 'Action plan updated in store',
    data: { actionPlanId },
  });
}

/**
 * Remove an action plan from the store (after API deletion)
 * @param {string} actionPlanId - The ID of the action plan to remove
 */
export function removeActionPlanFromStore(actionPlanId) {
  if (!actionPlanId) return;
  store.commit('removeActionPlan', { actionPlanId });
  logger.info({
    fn: removeActionPlanFromStore,
    message: 'Action plan removed from store',
    data: { actionPlanId },
  });
}

/**
 * Refresh action plans in store from API
 * Always fetches from API regardless of cache state
 * @returns {Promise<Array>} Array of action plans
 */
export async function refreshActionPlansInStore() {
  return loadActionPlansIntoStore(true);
}

/**
 * Get all action plans
 * @returns {Promise<Object>} Action plans data
 */
export async function getActionPlans() {
  try {
    logger.info({
      fn: getActionPlans,
      message: 'Fetching all action plans',
    });

    const result = await getActionPlansData();
    const actionPlans = result?.data?.value || [];

    logger.info({
      fn: getActionPlans,
      message: 'Action plans fetched successfully',
      data: { count: actionPlans.length },
    });

    return {
      success: true,
      actionPlans,
      totalCount: result?.data?.['@odata.count'] || actionPlans.length,
      metadata: {
        context: result?.data?.['@odata.context'],
        nextLink: result?.data?.['@odata.nextLink'],
      },
    };
  } catch (error) {
    logger.error({
      fn: getActionPlans,
      message: 'Failed to fetch action plans',
      data: { error },
    });
    throw error;
  }
}

/**
 * Create a new action plan
 * @param {string} workbookId - The workbook ID
 * @param {string} action - The action text
 * @param {string} [chapterId] - Optional chapter ID
 * @param {string} [questionId] - Optional question ID
 * @returns {Promise<Object>} Result of the creation
 */
export async function createActionPlan(
  workbookId,
  action,
  chapterId = null,
  questionId = null
) {
  try {
    if (!workbookId || !action) {
      throw new Error('workbookId and action are required');
    }

    logger.info({
      fn: createActionPlan,
      message: 'Creating action plan',
      data: { workbookId, action, chapterId, questionId },
    });

    const result = await postActionPlanData({
      workbookId,
      action,
      chapterId,
      questionId,
    });

    logger.info({
      fn: createActionPlan,
      message: 'Action plan created successfully',
      data: { result },
    });

    return {
      success: true,
      result,
    };
  } catch (error) {
    logger.error({
      fn: createActionPlan,
      message: 'Failed to create action plan',
      data: { error, workbookId, action, chapterId, questionId },
    });
    throw error;
  }
}

/**
 * Create a test action plan with current workbook
 * Usage: POWERPOD.actionPlanHelper.createTest("My action item")
 */
async function createTest(action, chapterId = null, questionId = null) {
  const workbookId = getCurrentWorkbookId();
  if (!workbookId) {
    console.error(
      'No workbook ID found. Make sure you are on a workbook page.'
    );
    return;
  }

  console.log('Creating test action plan...', {
    workbookId,
    action,
    chapterId,
    questionId,
  });
  const result = await createActionPlan(
    workbookId,
    action,
    chapterId,
    questionId
  );
  console.log('✅ Action plan created:', result);
  return result;
}

/**
 * Create multiple test action plans
 * Usage: POWERPOD.actionPlanHelper.createMultiple(["Action 1", "Action 2", "Action 3"])
 */
async function createMultiple(actions, chapterId = null, questionId = null) {
  const workbookId = getCurrentWorkbookId();
  if (!workbookId) {
    console.error(
      'No workbook ID found. Make sure you are on a workbook page.'
    );
    return;
  }

  console.log(`Creating ${actions.length} test action plans...`);
  const results = [];

  for (const action of actions) {
    try {
      const result = await createActionPlan(
        workbookId,
        action,
        chapterId,
        questionId
      );
      results.push(result);
      console.log(`✅ Created: "${action}"`);
    } catch (error) {
      console.error(`❌ Failed to create: "${action}"`, error);
    }
  }

  console.log(`✅ Created ${results.length} of ${actions.length} action plans`);
  return results;
}

/**
 * Get all action plans
 * Usage: POWERPOD.actionPlanHelper.getAll()
 */
async function getAll() {
  console.log('Fetching all action plans...');
  const result = await getActionPlans();
  console.log(
    `✅ Found ${result.totalCount} action plans:`,
    result.actionPlans
  );
  return result;
}

// Maintain backward compatibility by creating an object with all functions
const ActionPlanHelper = {
  getActionPlans,
  createActionPlan,
  // Store-based cache functions
  getActionPlansFromStore,
  areActionPlansLoaded,
  getActionPlansForWorkbook,
  getActionPlansForQuestion,
  loadActionPlansIntoStore,
  addActionPlanToStore,
  updateActionPlanInStore,
  removeActionPlanFromStore,
  refreshActionPlansInStore,
  // Test helpers
  createTest,
  createMultiple,
  getAll,
};

export default ActionPlanHelper;

POWERPOD.actionPlanHelper = ActionPlanHelper;

// Log available commands when loaded
if (typeof window !== 'undefined') {
  console.log('Action Plan Helper loaded! Available commands:');
  console.log('  POWERPOD.actionPlanHelper.createTest("My action")');
  console.log(
    '  POWERPOD.actionPlanHelper.createMultiple(["Action 1", "Action 2"])'
  );
  console.log('  POWERPOD.actionPlanHelper.getAll()');
}
