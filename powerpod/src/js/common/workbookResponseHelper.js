import { POWERPOD } from './constants.js';
import { Logger } from './logger.js';
import { getCurrentWorkbookId } from './workbookUtils.js';

const logger = Logger('common/workbookResponseHelper');

/**
 * Fetch all responses for a specific workbook
 * @param {string} workbookId - The workbook ID
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} Response data with metadata
 */
export async function getResponsesForWorkbook(workbookId, options = {}) {
  try {
    logger.info({
      fn: 'getResponsesForWorkbook',
      message: `Fetching responses for workbook: ${workbookId}`,
      data: { workbookId, options },
    });

    const result = await POWERPOD.fetch.getWorkbookResponsesByWorkbook({
      workbookId,
      ...options,
    });

    const responses = result?.data?.value || [];

    logger.info({
      fn: 'getResponsesForWorkbook',
      message: `Found ${responses.length} responses for workbook ${workbookId}`,
      data: { workbookId, responseCount: responses.length },
    });

    return {
      responses,
      totalCount: result?.data?.['@odata.count'] || responses.length,
      metadata: {
        context: result?.data?.['@odata.context'],
        nextLink: result?.data?.['@odata.nextLink'],
      },
      workbookId,
    };
  } catch (error) {
    logger.error({
      fn: 'getResponsesForWorkbook',
      message: `Failed to fetch responses for workbook ${workbookId}`,
      data: { workbookId, error: error.message },
    });
    throw new Error(`Failed to fetch workbook responses: ${error.message}`);
  }
}

/**
 * Fetch responses for a specific workbook and question
 * @param {string} workbookId - The workbook ID
 * @param {string} questionId - The question ID
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} Response data with metadata
 */
export async function getResponsesForWorkbookAndQuestion(
  workbookId,
  questionId,
  options = {}
) {
  try {
    logger.info({
      fn: 'getResponsesForWorkbookAndQuestion',
      message: `Fetching responses for workbook: ${workbookId}, question: ${questionId}`,
      data: { workbookId, questionId, options },
    });

    const result =
      await POWERPOD.fetch.getWorkbookResponsesByWorkbookAndQuestion({
        workbookId,
        questionId,
        ...options,
      });

    const responses = result?.data?.value || [];

    logger.info({
      fn: 'getResponsesForWorkbookAndQuestion',
      message: `Found ${responses.length} responses for workbook ${workbookId}, question ${questionId}`,
      data: { workbookId, questionId, responseCount: responses.length },
    });

    return {
      responses,
      totalCount: result?.data?.['@odata.count'] || responses.length,
      metadata: {
        context: result?.data?.['@odata.context'],
        nextLink: result?.data?.['@odata.nextLink'],
      },
      workbookId,
      questionId,
    };
  } catch (error) {
    logger.error({
      fn: 'getResponsesForWorkbookAndQuestion',
      message: `Failed to fetch responses for workbook ${workbookId}, question ${questionId}`,
      data: { workbookId, questionId, error: error.message },
    });
    throw new Error(`Failed to fetch workbook responses: ${error.message}`);
  }
}

/**
 * Create a new workbook response
 * @param {string} questionId - The question ID
 * @param {string} response - The response text
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} Created response data
 */
export async function createResponse(questionId, response, options = {}) {
  const workbookId = getCurrentWorkbookId();
  if (!workbookId) {
    throw new Error('No workbook ID available');
  }
  try {
    logger.info({
      fn: 'createResponse',
      message: `Creating response for workbook: ${workbookId}, question: ${questionId}`,
      data: {
        workbookId,
        questionId,
        response: response?.substring(0, 100) + '...',
      },
    });

    const result = await POWERPOD.fetch.postWorkbookResponseData({
      workbookId,
      questionId,
      response,
      ...options,
    });

    logger.info({
      fn: 'createResponse',
      message: `Successfully created response`,
      data: {
        workbookId,
        questionId,
        responseId: result?.data?.quartech_workbookresponseid,
      },
    });

    return {
      response: result?.data,
      success: true,
      workbookId,
      questionId,
    };
  } catch (error) {
    logger.error({
      fn: 'createResponse',
      message: `Failed to create response for workbook ${workbookId}, question ${questionId}`,
      data: { workbookId, questionId, error: error.message },
    });
    throw new Error(`Failed to create workbook response: ${error.message}`);
  }
}

/**
 * Update an existing workbook response
 * @param {string} responseId - The response ID to update
 * @param {string} response - The new response text (optional)
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} Update result
 */
export async function updateResponse(responseId, response = null, options = {}) {
  try {
    logger.info({
      fn: 'updateResponse',
      message: `Updating response: ${responseId}`,
      data: { responseId, hasResponse: !!response },
    });

    const result = await POWERPOD.fetch.patchWorkbookResponseData({
      id: responseId,
      response,
      ...options,
    });

    logger.info({
      fn: 'updateResponse',
      message: `Successfully updated response ${responseId}`,
      data: { responseId },
    });

    return {
      success: true,
      responseId,
      updated: result?.data,
    };
  } catch (error) {
    logger.error({
      fn: 'updateResponse',
      message: `Failed to update response ${responseId}`,
      data: { responseId, error: error.message },
    });
    throw new Error(`Failed to update workbook response: ${error.message}`);
  }
}

/**
 * Delete a workbook response
 * @param {string} responseId - The response ID to delete
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} Delete result
 */
export async function deleteResponse(responseId, options = {}) {
  try {
    logger.info({
      fn: 'deleteResponse',
      message: `Deleting response: ${responseId}`,
      data: { responseId },
    });

    await POWERPOD.fetch.deleteWorkbookResponseData({
      id: responseId,
      ...options,
    });

    logger.info({
      fn: 'deleteResponse',
      message: `Successfully deleted response ${responseId}`,
      data: { responseId },
    });

    return {
      success: true,
      responseId,
      deleted: true,
    };
  } catch (error) {
    logger.error({
      fn: 'deleteResponse',
      message: `Failed to delete response ${responseId}`,
      data: { responseId, error: error.message },
    });
    throw new Error(`Failed to delete workbook response: ${error.message}`);
  }
}

/**
 * Get the most recent response for a specific workbook and question
 * @param {string} workbookId - The workbook ID
 * @param {string} questionId - The question ID
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object|null>} Most recent response or null if none found
 */
export async function getLatestResponse(workbookId, questionId, options = {}) {
  try {
    const result = await getResponsesForWorkbookAndQuestion(
      workbookId,
      questionId,
      options
    );

    if (result.responses && result.responses.length > 0) {
      const latestResponse = result.responses[0];

      logger.info({
        fn: 'getLatestResponse',
        message: `Found latest response for workbook ${workbookId}, question ${questionId}`,
        data: {
          workbookId,
          questionId,
          responseId: latestResponse.quartech_workbookresponseid,
          createdOn: latestResponse.createdon,
        },
      });

      return latestResponse;
    }

    logger.info({
      fn: 'getLatestResponse',
      message: `No responses found for workbook ${workbookId}, question ${questionId}`,
      data: { workbookId, questionId },
    });

    return null;
  } catch (error) {
    logger.error({
      fn: 'getLatestResponse',
      message: `Failed to get latest response for workbook ${workbookId}, question ${questionId}`,
      data: { workbookId, questionId, error: error.message },
    });
    throw error;
  }
}

/**
 * Check if a response exists for a specific workbook and question
 * @param {string} workbookId - The workbook ID
 * @param {string} questionId - The question ID
 * @param {Object} options - Additional fetch options
 * @returns {Promise<boolean>} True if response exists, false otherwise
 */
export async function hasResponse(workbookId, questionId, options = {}) {
  try {
    const latestResponse = await getLatestResponse(
      workbookId,
      questionId,
      options
    );
    return latestResponse !== null;
  } catch (error) {
    logger.error({
      fn: 'hasResponse',
      message: `Failed to check if response exists for workbook ${workbookId}, question ${questionId}`,
      data: { workbookId, questionId, error: error.message },
    });
    return false;
  }
}

/**
 * Get response statistics for a workbook
 * @param {string} workbookId - The workbook ID
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} Response statistics
 */
export async function getResponseStats(workbookId, options = {}) {
  try {
    const result = await getResponsesForWorkbook(workbookId, options);
    const responses = result.responses || [];

    const responsesByQuestion = new Map();
    responses.forEach((response) => {
      const questionId = response._quartech_question_value;
      if (!responsesByQuestion.has(questionId)) {
        responsesByQuestion.set(questionId, []);
      }
      responsesByQuestion.get(questionId).push(response);
    });

    const stats = {
      totalResponses: responses.length,
      uniqueQuestions: responsesByQuestion.size,
      questionsWithMultipleResponses: 0,
      averageResponsesPerQuestion: 0,
      responsesByQuestion: Object.fromEntries(responsesByQuestion),
      workbookId,
    };

    responsesByQuestion.forEach((questionResponses) => {
      if (questionResponses.length > 1) {
        stats.questionsWithMultipleResponses++;
      }
    });

    if (stats.uniqueQuestions > 0) {
      stats.averageResponsesPerQuestion = (
        stats.totalResponses / stats.uniqueQuestions
      ).toFixed(2);
    }

    logger.info({
      fn: 'getResponseStats',
      message: `Generated response statistics for workbook ${workbookId}`,
      data: { workbookId, stats },
    });

    return stats;
  } catch (error) {
    logger.error({
      fn: 'getResponseStats',
      message: `Failed to get response statistics for workbook ${workbookId}`,
      data: { workbookId, error: error.message },
    });
    throw new Error(`Failed to get response statistics: ${error.message}`);
  }
}

/**
 * Get workbook responses from POWERPOD memory (if loaded)
 * @returns {Object} Workbook responses data from memory
 */
export function getFromMemory() {
  return {
    data: POWERPOD.workbookResponses.data,
    responsesByQuestion: POWERPOD.workbookResponses.responsesByQuestion,
    isLoaded: POWERPOD.workbookResponses.isLoaded,
    isLoading: POWERPOD.workbookResponses.isLoading,
    workbookId: POWERPOD.workbookResponses.workbookId,
    lastUpdated: POWERPOD.workbookResponses.lastUpdated,
    error: POWERPOD.workbookResponses.error
  };
}

/**
 * Get response for a specific question from memory
 * @param {string} questionId - The question ID
 * @returns {Object|null} Response object or null if not found
 */
export function getResponseFromMemory(questionId) {
  if (!POWERPOD.workbookResponses.isLoaded) {
    logger.warn({
      fn: 'getResponseFromMemory',
      message: 'Workbook responses not loaded in memory',
      data: { questionId }
    });
    return null;
  }

  return POWERPOD.workbookResponses.responsesByQuestion.get(questionId) || null;
}

/**
 * Check if responses are loaded in memory for a specific workbook
 * @param {string} workbookId - The workbook ID to check
 * @returns {boolean} True if responses are loaded for this workbook
 */
export function isLoadedInMemory(workbookId) {
  return POWERPOD.workbookResponses.isLoaded &&
         POWERPOD.workbookResponses.workbookId === workbookId;
}

/**
 * Clear workbook responses from memory
 */
export function clearMemory() {
  logger.info({
    fn: 'clearMemory',
    message: 'Clearing workbook responses from memory'
  });

  POWERPOD.workbookResponses.data = [];
  POWERPOD.workbookResponses.responsesByQuestion.clear();
  POWERPOD.workbookResponses.isLoaded = false;
  POWERPOD.workbookResponses.isLoading = false;
  POWERPOD.workbookResponses.workbookId = null;
  POWERPOD.workbookResponses.lastUpdated = null;
  POWERPOD.workbookResponses.error = null;
}

/**
 * Get memory statistics
 * @returns {Object} Memory usage statistics
 */
export function getMemoryStats() {
  const responses = POWERPOD.workbookResponses.data;
  const responsesByQuestion = POWERPOD.workbookResponses.responsesByQuestion;

  return {
    totalResponses: responses.length,
    uniqueQuestions: responsesByQuestion.size,
    isLoaded: POWERPOD.workbookResponses.isLoaded,
    isLoading: POWERPOD.workbookResponses.isLoading,
    workbookId: POWERPOD.workbookResponses.workbookId,
    lastUpdated: POWERPOD.workbookResponses.lastUpdated,
    hasError: !!POWERPOD.workbookResponses.error,
    error: POWERPOD.workbookResponses.error
  };
}

// Maintain backward compatibility by creating an object with all functions
const WorkbookResponseHelper = {
  getResponsesForWorkbook,
  getResponsesForWorkbookAndQuestion,
  createResponse,
  updateResponse,
  deleteResponse,
  getLatestResponse,
  hasResponse,
  getResponseStats,
  // Memory utility functions
  getFromMemory,
  getResponseFromMemory,
  isLoadedInMemory,
  clearMemory,
  getMemoryStats,
};

export default WorkbookResponseHelper;

POWERPOD.workbookResponseHelper = WorkbookResponseHelper;
