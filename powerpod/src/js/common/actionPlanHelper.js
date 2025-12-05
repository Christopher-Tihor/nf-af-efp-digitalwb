// @ts-nocheck
import { POWERPOD } from './constants.js';
import { Logger } from './logger.js';
import { getCurrentWorkbookId } from './workbookUtils.js';
import { getActionPlansData, postActionPlanData } from './fetch.js';

const logger = Logger('common/actionPlanHelper');

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
