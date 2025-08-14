/**
 * Workbook Response API Usage Examples
 * 
 * This file demonstrates how to use the workbook response APIs and helper functions
 * for common operations like fetching, creating, updating, and deleting responses.
 */

import WorkbookResponseHelper from '../common/workbookResponseHelper.js';
import { POWERPOD } from '../common/constants.js';
import { getWorkbookId } from '../common/workbookUtils.js';

// Export all examples for easy testing
// POWERPOD.examples = {
//   testWorkbookId: testWorkbookId,
//   fetchWorkbookResponses: exampleFetchWorkbookResponses,
//   fetchQuestionResponses: exampleFetchQuestionResponses,
//   createResponse: exampleCreateResponse,
//   updateResponse: exampleUpdateResponse,
//   deleteResponse: exampleDeleteResponse,
//   getLatestResponse: exampleGetLatestResponse,
//   checkResponseExists: exampleCheckResponseExists,
//   getResponseStats: exampleGetResponseStats,
//   directAPIUsage: exampleDirectAPIUsage,
//   completeWorkflow: exampleCompleteWorkflow,
//   batchOperations: exampleBatchOperations
// };

/**
 * Get the current workbook ID from URL parameters or DOM elements
 * @returns {string|null} The workbook ID or null if not found
 */
function getCurrentWorkbookId() {
  const workbookId = getWorkbookId();
  if (!workbookId) {
    console.warn('No workbook ID found in URL parameters or DOM elements');
    console.log('Make sure the URL contains ?id=your-workbook-id or there is a #quartech_workbook element');
    return null;
  }
  return workbookId;
}

/**
 * Quick test function to verify the workbook ID is available
 * Call this first to make sure the examples will work
 */
export function testWorkbookId() {
  const workbookId = getCurrentWorkbookId();
  if (workbookId) {
    console.log(`✅ Workbook ID found: ${workbookId}`);
    console.log('You can now run the example functions!');
    return workbookId;
  } else {
    console.error('❌ No workbook ID found. Examples will not work.');
    console.log('Make sure you are on a workbook page with ?id=workbook-id in the URL');
    return null;
  }
}
/**
 * Example 1: Fetch all responses for a workbook
 */
export async function exampleFetchWorkbookResponses() {
  const workbookId = getCurrentWorkbookId();
  if (!workbookId) {
    throw new Error('No workbook ID available');
  }

  try {
    // Using the helper (recommended)
    const result = await WorkbookResponseHelper.getResponsesForWorkbook(workbookId);
    
    console.log(`Found ${result.totalCount} responses for workbook ${workbookId}`);
    console.log('Responses:', result.responses);
    
    // Process each response
    result.responses.forEach(response => {
      console.log(`Response ID: ${response.quartech_workbookresponseid}`);
      console.log(`Response: ${response.quartech_response}`);
      console.log(`Question: ${response.quartech_Question?.quartech_questiontext}`);
      console.log(`Created: ${response.createdon}`);
      console.log('---');
    });
    
    return result;
    
  } catch (error) {
    console.error('Failed to fetch workbook responses:', error);
    throw error;
  }
}

/**
 * Example 2: Fetch responses for a specific question
 */
export async function exampleFetchQuestionResponses(questionId = 'your-question-id-here') {
  const workbookId = getCurrentWorkbookId();
  if (!workbookId) {
    throw new Error('No workbook ID available');
  }
  
  try {
    // Using the helper
    const result = await WorkbookResponseHelper.getResponsesForWorkbookAndQuestion(
      workbookId, 
      questionId
    );
    
    console.log(`Found ${result.totalCount} responses for question ${questionId}`);
    
    return result;
    
  } catch (error) {
    console.error('Failed to fetch question responses:', error);
    throw error;
  }
}

/**
 * Example 3: Create a new response
 */
export async function exampleCreateResponse(questionId = 'your-question-id-here', responseText = 'This is my answer to the question.') {
  const workbookId = getCurrentWorkbookId();
  if (!workbookId) {
    throw new Error('No workbook ID available');
  }

  try {
    // Using the helper
    const result = await WorkbookResponseHelper.createResponse(
      questionId,
      responseText,
    );
    
    console.log('Response created successfully:', result.response);
    
    return result;
    
  } catch (error) {
    console.error('Failed to create response:', error);
    throw error;
  }
}

/**
 * Example 4: Update an existing response
 */
export async function exampleUpdateResponse(responseId = 'your-response-id-here', newResponseText = 'This is my updated answer.') {
  
  try {
    // Using the helper
    const result = await WorkbookResponseHelper.updateResponse(
      responseId,
      newResponseText,
    );
    
    console.log('Response updated successfully:', result);
    
    return result;
    
  } catch (error) {
    console.error('Failed to update response:', error);
    throw error;
  }
}

/**
 * Example 5: Delete a response
 */
export async function exampleDeleteResponse(responseId = 'your-response-id-here') {
  
  try {
    // Using the helper
    const result = await WorkbookResponseHelper.deleteResponse(responseId);
    
    console.log('Response deleted successfully:', result);
    
    return result;
    
  } catch (error) {
    console.error('Failed to delete response:', error);
    throw error;
  }
}

/**
 * Example 6: Get the latest response for a question
 */
export async function exampleGetLatestResponse(questionId = 'your-question-id-here') {
  const workbookId = getCurrentWorkbookId();
  if (!workbookId) {
    throw new Error('No workbook ID available');
  }
  
  try {
    // Using the helper
    const latestResponse = await WorkbookResponseHelper.getLatestResponse(
      workbookId,
      questionId
    );
    
    if (latestResponse) {
      console.log('Latest response found:', latestResponse);
      console.log(`Response: ${latestResponse.quartech_response}`);
      console.log(`Created: ${latestResponse.createdon}`);
    } else {
      console.log('No responses found for this question.');
    }
    
    return latestResponse;
    
  } catch (error) {
    console.error('Failed to get latest response:', error);
    throw error;
  }
}

/**
 * Example 7: Check if a response exists
 */
export async function exampleCheckResponseExists(questionId = 'your-question-id-here') {
  const workbookId = getCurrentWorkbookId();
  if (!workbookId) {
    throw new Error('No workbook ID available');
  }
  
  try {
    // Using the helper
    const exists = await WorkbookResponseHelper.hasResponse(workbookId, questionId);
    
    console.log(`Response exists for question ${questionId}: ${exists}`);
    
    return exists;
    
  } catch (error) {
    console.error('Failed to check if response exists:', error);
    return false;
  }
}

/**
 * Example 8: Get response statistics
 */
export async function exampleGetResponseStats() {
  const workbookId = getCurrentWorkbookId();
  if (!workbookId) {
    throw new Error('No workbook ID available');
  }
  
  try {
    // Using the helper
    const stats = await WorkbookResponseHelper.getResponseStats(workbookId);
    
    console.log('Response Statistics:');
    console.log(`Total Responses: ${stats.totalResponses}`);
    console.log(`Unique Questions: ${stats.uniqueQuestions}`);
    console.log(`Questions with Multiple Responses: ${stats.questionsWithMultipleResponses}`);
    console.log(`Average Responses per Question: ${stats.averageResponsesPerQuestion}`);
    
    return stats;
    
  } catch (error) {
    console.error('Failed to get response statistics:', error);
    throw error;
  }
}

/**
 * Example 9: Using the low-level fetch APIs directly
 */
export async function exampleDirectAPIUsage() {
  const workbookId = getCurrentWorkbookId();
  if (!workbookId) {
    throw new Error('No workbook ID available');
  }
  
  try {
    // Direct API usage (not recommended for most cases)
    const result = await POWERPOD.fetch.getWorkbookResponsesByWorkbook({
      workbookId,
      skipCache: true
    });
    
    console.log('Direct API result:', result);
    
    return result;
    
  } catch (error) {
    console.error('Failed to use direct API:', error);
    throw error;
  }
}

/**
 * Example 10: Complete workflow - Create, Read, Update, Delete
 */
export async function exampleCompleteWorkflow(questionId = 'your-question-id-here') {
  const workbookId = getCurrentWorkbookId();
  if (!workbookId) {
    throw new Error('No workbook ID available');
  }
  
  try {
    console.log('=== Complete CRUD Workflow ===');
    
    // 1. Check if response already exists
    console.log('1. Checking if response exists...');
    const exists = await WorkbookResponseHelper.hasResponse(workbookId, questionId);
    console.log(`Response exists: ${exists}`);
    
    // 2. Create a new response
    console.log('2. Creating new response...');
    const createResult = await WorkbookResponseHelper.createResponse(
      questionId,
      'Initial response text',
    );
    const responseId = createResult.response.quartech_workbookresponseid;
    console.log(`Created response with ID: ${responseId}`);
    
    // 3. Read the response back
    console.log('3. Reading response back...');
    const latestResponse = await WorkbookResponseHelper.getLatestResponse(workbookId, questionId);
    console.log(`Read response: ${latestResponse.quartech_response}`);
    
    // 4. Update the response
    console.log('4. Updating response...');
    await WorkbookResponseHelper.updateResponse(
      responseId,
      'Updated response text',
    );
    console.log('Response updated successfully');
    
    // 5. Get updated response
    console.log('5. Getting updated response...');
    const updatedResponse = await WorkbookResponseHelper.getLatestResponse(workbookId, questionId);
    console.log(`Updated response: ${updatedResponse.quartech_response}`);
    
    // 6. Get statistics
    console.log('6. Getting response statistics...');
    const stats = await WorkbookResponseHelper.getResponseStats(workbookId);
    console.log(`Total responses in workbook: ${stats.totalResponses}`);
    
    // 7. Delete the response (optional)
    console.log('7. Deleting response...');
    await WorkbookResponseHelper.deleteResponse(responseId);
    console.log('Response deleted successfully');
    
    console.log('=== Workflow completed successfully ===');
    
    return {
      success: true,
      responseId,
      stats
    };
    
  } catch (error) {
    console.error('Workflow failed:', error);
    throw error;
  }
}

/**
 * Example 11: Batch operations
 */
export async function exampleBatchOperations(questions = [
  { id: 'question-1-id', response: 'Answer to question 1' },
  { id: 'question-2-id', response: 'Answer to question 2' },
  { id: 'question-3-id', response: 'Answer to question 3' }
]) {
  const workbookId = getCurrentWorkbookId();
  if (!workbookId) {
    throw new Error('No workbook ID available');
  }
  
  try {
    console.log('=== Batch Operations ===');
    
    // Create multiple responses
    const createPromises = questions.map(q =>
      WorkbookResponseHelper.createResponse(q.id, q.response)
    );
    
    const createResults = await Promise.all(createPromises);
    console.log(`Created ${createResults.length} responses`);
    
    // Get all responses for the workbook
    const allResponses = await WorkbookResponseHelper.getResponsesForWorkbook(workbookId);
    console.log(`Total responses in workbook: ${allResponses.totalCount}`);
    
    return {
      created: createResults.length,
      total: allResponses.totalCount
    };
    
  } catch (error) {
    console.error('Batch operations failed:', error);
    throw error;
  }
}
