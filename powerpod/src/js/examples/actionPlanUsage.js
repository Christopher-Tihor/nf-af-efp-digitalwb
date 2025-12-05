// @ts-nocheck
/**
 * Action Plan API Usage Examples
 *
 * This file demonstrates how to use the Action Plan API endpoints
 * and helper functions.
 *
 * Browser Console Quick Start:
 * - POWERPOD.actionPlanHelper.createTest("My action item")
 * - POWERPOD.actionPlanHelper.createMultiple(["Action 1", "Action 2"])
 * - POWERPOD.actionPlanHelper.getAll()
 */

import { getActionPlansData, postActionPlanData } from '../common/fetch.js';
import ActionPlanHelper from '../common/actionPlanHelper.js';

/**
 * Example 1: Get all action plans using the fetch API directly
 */
export async function exampleGetActionPlansDirectly() {
  try {
    console.log('Fetching all action plans...');
    
    const result = await getActionPlansData();
    
    console.log(`Found ${result.value.length} action plans`);
    console.log('Action plans:', result.value);
    
    // Process each action plan
    result.value.forEach(actionPlan => {
      console.log(`ID: ${actionPlan.quartech_actionplanid}`);
      console.log(`Action: ${actionPlan.quartech_action}`);
      console.log(`Workbook: ${actionPlan._quartech_workbook_value}`);
      console.log(`Chapter: ${actionPlan._quartech_chapter_value}`);
      console.log(`Question: ${actionPlan._quartech_workbookquestion_value}`);
      console.log('---');
    });
    
    return result;
  } catch (error) {
    console.error('Failed to fetch action plans:', error);
    throw error;
  }
}

/**
 * Example 2: Get all action plans using the helper
 */
export async function exampleGetActionPlansWithHelper() {
  try {
    console.log('Fetching all action plans with helper...');
    
    const result = await ActionPlanHelper.getActionPlans();
    
    console.log(`Found ${result.totalCount} action plans`);
    console.log('Action plans:', result.actionPlans);
    
    return result;
  } catch (error) {
    console.error('Failed to fetch action plans:', error);
    throw error;
  }
}

/**
 * Example 3: Create a new action plan using the fetch API directly
 */
export async function exampleCreateActionPlanDirectly(
  workbookId = 'your-workbook-id-here',
  action = 'Implement soil testing program'
) {
  try {
    console.log('Creating action plan...');
    
    const result = await postActionPlanData({
      workbookId,
      action,
      chapterId: 'optional-chapter-id',
      questionId: 'optional-question-id',
    });
    
    console.log('Action plan created successfully:', result);
    
    return result;
  } catch (error) {
    console.error('Failed to create action plan:', error);
    throw error;
  }
}

/**
 * Example 4: Create a new action plan using the helper
 */
export async function exampleCreateActionPlanWithHelper(
  workbookId = 'your-workbook-id-here',
  action = 'Develop nutrient management plan'
) {
  try {
    console.log('Creating action plan with helper...');
    
    const result = await ActionPlanHelper.createActionPlan(
      workbookId,
      action,
      'optional-chapter-id',
      'optional-question-id'
    );
    
    console.log('Action plan created successfully:', result);
    
    return result;
  } catch (error) {
    console.error('Failed to create action plan:', error);
    throw error;
  }
}

/**
 * Example 5: Create action plan with only required fields
 */
export async function exampleCreateMinimalActionPlan(
  workbookId = 'your-workbook-id-here',
  action = 'Review water management practices'
) {
  try {
    console.log('Creating minimal action plan...');
    
    // Only workbookId and action are required
    const result = await ActionPlanHelper.createActionPlan(workbookId, action);
    
    console.log('Action plan created successfully:', result);
    
    return result;
  } catch (error) {
    console.error('Failed to create action plan:', error);
    throw error;
  }
}

/**
 * Example 6: Complete workflow - Create and retrieve
 */
export async function exampleCompleteWorkflow(
  workbookId = 'your-workbook-id-here'
) {
  try {
    console.log('=== Complete Action Plan Workflow ===');
    
    // 1. Get existing action plans
    console.log('1. Fetching existing action plans...');
    const existingPlans = await ActionPlanHelper.getActionPlans();
    console.log(`Found ${existingPlans.totalCount} existing action plans`);
    
    // 2. Create a new action plan
    console.log('2. Creating new action plan...');
    const createResult = await ActionPlanHelper.createActionPlan(
      workbookId,
      'Test action plan from workflow',
      null, // no chapter
      null  // no question
    );
    console.log('Action plan created successfully');
    
    // 3. Get all action plans again to verify
    console.log('3. Fetching updated action plans...');
    const updatedPlans = await ActionPlanHelper.getActionPlans();
    console.log(`Now have ${updatedPlans.totalCount} action plans`);
    
    console.log('=== Workflow completed successfully ===');
    
    return {
      before: existingPlans.totalCount,
      after: updatedPlans.totalCount,
      created: createResult,
    };
  } catch (error) {
    console.error('Workflow failed:', error);
    throw error;
  }
}

// Export all examples
export default {
  exampleGetActionPlansDirectly,
  exampleGetActionPlansWithHelper,
  exampleCreateActionPlanDirectly,
  exampleCreateActionPlanWithHelper,
  exampleCreateMinimalActionPlan,
  exampleCompleteWorkflow,
};

