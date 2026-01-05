import { POWERPOD } from './constants.js';
import { Logger } from './logger.js';
import { getCurrentWorkbookId } from './workbookUtils.js';
import { loadChaptersAndQuestions, getStoredQuestionsData, isChaptersAndQuestionsLoaded } from './chaptersAndQuestionsUtils.js';
import { updateQuestionResponse, isQuestionnaireLoaded, getQuestionFromStore } from './questionnaire.js';

const logger = Logger('common/workbookResponseHelper');

/**
 * Get chapterId for a given questionId
 * @param {string} questionId - The question ID
 * @returns {string|null} The chapter ID or null if not found
 */
export function getChapterIdForQuestion(questionId) {
  // First try to get from workbookQuestionsAndResponses memory (most reliable)
  if (POWERPOD.workbookQuestionsAndResponses.isLoaded) {
    const entry = POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.get(questionId);
    if (entry && entry.question && entry.question._quartech_chapter_value) {
      return entry.question._quartech_chapter_value;
    }
  }

  // Then try to get from stored questions data
  if (isChaptersAndQuestionsLoaded()) {
    const questionsData = getStoredQuestionsData();
    if (questionsData && questionsData.value) {
      const question = questionsData.value.find(q => q.quartech_workbookquestionid === questionId);
      if (question && question._quartech_chapter_value) {
        return question._quartech_chapter_value;
      }
    }
  }

  // Finally try to find chapterId by traversing questionnaire store structure
  if (isQuestionnaireLoaded()) {
    const questionnaire = POWERPOD.state?.questionnaire;
    if (questionnaire?.chapters) {
      const findChapterIdForQuestion = (chapters) => {
        for (const chapterGroup of chapters) {
          if (Array.isArray(chapterGroup)) {
            for (const chapter of chapterGroup) {
              // Check questions in main chapter
              if (chapter.questions) {
                const question = chapter.questions.find(q => q.id === questionId);
                if (question) return chapter.id;
              }
              // Check questions in subchapters
              if (chapter.subchapters) {
                const found = findChapterIdForQuestion([chapter.subchapters]);
                if (found) return found;
              }
            }
          }
        }
        return null;
      };

      const chapterId = findChapterIdForQuestion(questionnaire.chapters);
      if (chapterId) {
        return chapterId;
      }
    }
  }

  logger.warn({
    fn: 'getChapterIdForQuestion',
    message: `Could not find chapterId for question ${questionId}`,
    data: { questionId }
  });

  return null;
}

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
    // Get chapterId for the question
    const chapterId = getChapterIdForQuestion(questionId);

    logger.info({
      fn: 'createResponse',
      message: `Creating response for workbook: ${workbookId}, question: ${questionId}`,
      data: {
        workbookId,
        questionId,
        chapterId,
        response: response?.substring(0, 100) + '...',
      },
    });

    // Create the response (returns 204 No Content)
    await POWERPOD.fetch.postWorkbookResponseData({
      workbookId,
      questionId,
      chapterId,
      response,
      ...options,
    });

    logger.info({
      fn: 'createResponse',
      message: `POST request completed (204 No Content), fetching created response...`,
      data: { workbookId, questionId },
    });

    // Since POST returns 204 with no body, we need to fetch the newly created response
    // to get its ID and full data. Use direct query to workbook responses collection.
    const fetchResult = await POWERPOD.fetch.fetch({
      url: POWERPOD.fetch.ENDPOINT_URL.get_workbookresponses_direct(workbookId, questionId),
      contentType: POWERPOD.fetch.CONTENT_TYPE.json,
      datatype: POWERPOD.fetch.DATATYPE.json,
      includeODataHeaders: true,
      returnData: true,
      skipCache: true, // Always get fresh data
    });

    // Get the most recent response (should be the one we just created)
    const responses = fetchResult?.data?.value || [];
    const createdResponse = responses.length > 0 ? responses[0] : null;

    if (!createdResponse || !createdResponse.quartech_workbookresponseid) {
      logger.error({
        fn: 'createResponse',
        message: `Failed to fetch created response`,
        data: { workbookId, questionId, responses, fetchResult },
      });
      throw new Error('Failed to retrieve created response ID');
    }

    logger.info({
      fn: 'createResponse',
      message: `Successfully fetched created response`,
      data: {
        workbookId,
        questionId,
        responseId: createdResponse.quartech_workbookresponseid,
        fullResponseData: createdResponse,
      },
    });

    // Update questionnaire store if loaded
    if (isQuestionnaireLoaded() && createdResponse) {
      try {
        // Let updateQuestionResponse auto-calculate completion based on response content
        updateQuestionResponse(questionId, response, null, createdResponse);
        logger.info({
          fn: 'createResponse',
          message: `Updated questionnaire store for question ${questionId}`,
        });
      } catch (error) {
        logger.warn({
          fn: 'createResponse',
          message: `Failed to update questionnaire store for question ${questionId}`,
          data: { error: error.message },
        });
      }
    }

    return {
      response: createdResponse,
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
    // Try to get chapterId if we can determine the questionId
    let chapterId = null;

    // First try to get questionId from existing response data in memory
    if (POWERPOD.workbookQuestionsAndResponses.isLoaded) {
      for (const [qId, entry] of POWERPOD.workbookQuestionsAndResponses.questionsWithResponses) {
        if (entry.response && entry.response.quartech_workbookresponseid === responseId) {
          chapterId = getChapterIdForQuestion(qId);
          break;
        }
      }
    }

    logger.info({
      fn: 'updateResponse',
      message: `Updating response: ${responseId}`,
      data: { responseId, hasResponse: !!response, chapterId },
    });

    const result = await POWERPOD.fetch.patchWorkbookResponseData({
      id: responseId,
      response,
      chapterId,
      ...options,
    });

    logger.info({
      fn: 'updateResponse',
      message: `Successfully updated response ${responseId}`,
      data: { responseId },
    });

    // Update questionnaire store if loaded and we have question ID
    if (isQuestionnaireLoaded() && result?.data) {
      const questionId = result.data._quartech_question_value;
      if (questionId) {
        try {
          // Let updateQuestionResponse auto-calculate completion based on response content
          updateQuestionResponse(questionId, response, null, result.data);
          logger.info({
            fn: 'updateResponse',
            message: `Updated questionnaire store for question ${questionId}`,
          });
        } catch (error) {
          logger.warn({
            fn: 'updateResponse',
            message: `Failed to update questionnaire store for question ${questionId}`,
            data: { error: error.message },
          });
        }
      }
    }

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

    // Get question ID from existing POWERPOD response data before deleting
    let questionId = null;
    if (isQuestionnaireLoaded() && POWERPOD.workbookQuestionsAndResponses.isLoaded) {
      try {
        // Find the response in the existing data
        for (const [qId, entry] of POWERPOD.workbookQuestionsAndResponses.questionsWithResponses) {
          if (entry.response && entry.response.quartech_workbookresponseid === responseId) {
            questionId = qId;
            break;
          }
        }

        if (questionId) {
          logger.info({
            fn: 'deleteResponse',
            message: `Found question ID ${questionId} for response ${responseId}`,
          });
        } else {
          logger.warn({
            fn: 'deleteResponse',
            message: `Could not find question ID for response ${responseId} in existing data`,
          });
        }
      } catch (error) {
        logger.warn({
          fn: 'deleteResponse',
          message: `Error finding question ID for response deletion`,
          data: { responseId, error: error.message },
        });
      }
    }

    await POWERPOD.fetch.deleteWorkbookResponseData({
      id: responseId,
      ...options,
    });

    logger.info({
      fn: 'deleteResponse',
      message: `Successfully deleted response ${responseId}`,
      data: { responseId },
    });

    // Update questionnaire store to remove response
    if (isQuestionnaireLoaded() && questionId) {
      try {
        updateQuestionResponse(questionId, null, false, null);
        logger.info({
          fn: 'deleteResponse',
          message: `Updated questionnaire store to remove response for question ${questionId}`,
        });
      } catch (error) {
        logger.warn({
          fn: 'deleteResponse',
          message: `Failed to update questionnaire store for deleted question ${questionId}`,
          data: { error: error.message },
        });
      }
    }

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

/**
 * Load and organize workbook questions and responses into nested structure
 * @param {string} workbookId - The workbook ID
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Organized questions and responses data
 */
export async function loadQuestionsAndResponses(workbookId, options = {}) {
  try {
    logger.info({
      fn: 'loadQuestionsAndResponses',
      message: `Loading questions and responses for workbook: ${workbookId}`,
      data: { workbookId }
    });

    POWERPOD.workbookQuestionsAndResponses.isLoading = true;
    POWERPOD.workbookQuestionsAndResponses.error = null;

    // Check if already loaded for this workbook
    if (POWERPOD.workbookQuestionsAndResponses.isLoaded &&
        POWERPOD.workbookQuestionsAndResponses.workbookId === workbookId) {
      logger.info({
        fn: 'loadQuestionsAndResponses',
        message: 'Questions and responses already loaded from memory',
        data: { workbookId }
      });
      return getQuestionsAndResponsesFromMemory();
    }

    // Load questions using existing chaptersAndQuestionsUtils
    let questions = [];
    try {
      // Check if questions are already loaded in POWERPOD.workbook
      if (isChaptersAndQuestionsLoaded()) {
        console.log('Questions already loaded, using cached data');
        const questionsData = getStoredQuestionsData();
        questions = questionsData?.value || [];
      } else {
        console.log('Loading questions using loadChaptersAndQuestions');
        const result = await loadChaptersAndQuestions();
        if (result && result.questionsData) {
          questions = result.questionsData.value || [];
        } else {
          console.warn('Failed to load questions data');
        }
      }

      console.log(`Loaded ${questions.length} questions from API`);
    } catch (error) {
      logger.warn({
        fn: 'loadQuestionsAndResponses',
        message: 'Failed to load questions, continuing with responses only',
        data: { workbookId, error: error.message }
      });
    }

    // Load responses
    const responsesResult = await getResponsesForWorkbook(workbookId, options);
    const responses = responsesResult.responses || [];

    // Clear existing data
    POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.clear();
    POWERPOD.workbookQuestionsAndResponses.questionsByChapter.clear();

    // Create nested structure
    const questionsWithResponses = new Map();
    const questionsByChapter = new Map();

    // First, add all questions (if we have them)
    questions.forEach(question => {
      const questionId = question.quartech_workbookquestionid;
      const chapterId = question._quartech_chapter_value;

      if (questionId) {
        questionsWithResponses.set(questionId, {
          question: question,
          response: null
        });

        // Organize by chapter
        if (chapterId) {
          if (!questionsByChapter.has(chapterId)) {
            questionsByChapter.set(chapterId, []);
          }
          questionsByChapter.get(chapterId).push({
            question: question,
            response: null
          });
        }
      }
    });

    console.log(`Processed ${questions.length} questions into nested structure`);
    console.log(`Questions organized into ${questionsByChapter.size} chapters`);

    // Debug: Log some sample question data
    if (questions.length > 0) {
      console.log('Sample question:', {
        id: questions[0].quartech_workbookquestionid,
        name: questions[0].quartech_name,
        label: questions[0].quartech_label,
        questionType: questions[0].quartech_questiontype,
        chapterId: questions[0]._quartech_chapter_value,
        order: questions[0].quartech_order
      });
    }

    // Then, add responses to their corresponding questions
    // Only add responses for questions that exist in the active questions list
    // Responses for inactive questions (not in the list) are skipped
    responses.forEach(response => {
      const questionId = response._quartech_question_value;

      if (questionId) {
        if (questionsWithResponses.has(questionId)) {
          // Update existing question entry
          const entry = questionsWithResponses.get(questionId);
          entry.response = response;
        }
        // Skip responses for inactive questions (those not in our active questions list)
        // These questions have been filtered out at the API level (statecode eq 0)
      }
    });

    // Update chapter organization with responses
    questionsByChapter.forEach((chapterQuestions) => {
      chapterQuestions.forEach(entry => {
        const questionId = entry.question?.quartech_workbookquestionid;
        if (questionId && questionsWithResponses.has(questionId)) {
          entry.response = questionsWithResponses.get(questionId).response;
        }
      });
    });

    // Calculate statistics
    // Count answered questions (have actual responses) and skipped questions separately
    const totalQuestions = questionsWithResponses.size;
    let answeredQuestions = 0;
    let skippedQuestions = 0;

    Array.from(questionsWithResponses.values()).forEach(entry => {
      if (entry.response !== null) {
        // Check if skipped
        if (entry.response.quartech_chapterskipped === 100000000) {
          skippedQuestions++;
        }
        // Check if answered (has actual content)
        else if (entry.response.quartech_response &&
                 entry.response.quartech_response.trim() !== '') {
          answeredQuestions++;
        }
      }
    });

    // Calculate completion percentage: both answered and skipped questions count as "complete"
    // completedQuestions = answered + skipped
    const completedQuestions = answeredQuestions + skippedQuestions;
    const nonSkippedTotal = totalQuestions - skippedQuestions;
    const unansweredQuestions = totalQuestions - completedQuestions;
    const completionPercentage = totalQuestions > 0 ?
      Math.round((completedQuestions / totalQuestions) * 100) : 0;

    // Store in POWERPOD memory
    POWERPOD.workbookQuestionsAndResponses.questionsWithResponses = questionsWithResponses;
    POWERPOD.workbookQuestionsAndResponses.questionsByChapter = questionsByChapter;
    POWERPOD.workbookQuestionsAndResponses.stats = {
      totalQuestions,
      answeredQuestions,
      skippedQuestions,
      unansweredQuestions,
      nonSkippedTotal,
      completionPercentage,
      lastUpdated: new Date().toISOString()
    };
    POWERPOD.workbookQuestionsAndResponses.workbookId = workbookId;
    POWERPOD.workbookQuestionsAndResponses.isLoaded = true;
    POWERPOD.workbookQuestionsAndResponses.lastUpdated = new Date().toISOString();

    logger.info({
      fn: 'loadQuestionsAndResponses',
      message: `Loaded ${totalQuestions} questions: ${answeredQuestions} answered, ${skippedQuestions} skipped, ${unansweredQuestions} unanswered (${completionPercentage}% complete)`,
      data: {
        workbookId,
        totalQuestions,
        answeredQuestions,
        skippedQuestions,
        completedQuestions,
        unansweredQuestions,
        nonSkippedTotal,
        completionPercentage
      }
    });

    // Update questionnaire store if it's loaded
    if (isQuestionnaireLoaded()) {
      try {
        logger.info({
          fn: 'loadQuestionsAndResponses',
          message: 'Updating questionnaire store with loaded response data'
        });

        // Update each question in the questionnaire store with its response
        questionsWithResponses.forEach((entry, questionId) => {
          if (entry.response) {
            // Let updateQuestionResponse auto-calculate completion based on response content
            updateQuestionResponse(questionId, entry.response.quartech_response, null, entry.response);
          }
        });

        logger.info({
          fn: 'loadQuestionsAndResponses',
          message: `Updated questionnaire store with ${answeredQuestions} responses`
        });
      } catch (error) {
        logger.warn({
          fn: 'loadQuestionsAndResponses',
          message: 'Failed to update questionnaire store with response data',
          data: { error: error.message }
        });
      }
    }

    return getQuestionsAndResponsesFromMemory();

  } catch (error) {
    logger.error({
      fn: 'loadQuestionsAndResponses',
      message: `Failed to load questions and responses for workbook ${workbookId}`,
      data: { workbookId, error: error.message }
    });

    POWERPOD.workbookQuestionsAndResponses.error = error.message || 'Failed to load questions and responses';
    throw error;
  } finally {
    POWERPOD.workbookQuestionsAndResponses.isLoading = false;
  }
}

/**
 * Get questions and responses from memory
 * @returns {Object} Questions and responses data from memory
 */
export function getQuestionsAndResponsesFromMemory() {
  return {
    questionsWithResponses: POWERPOD.workbookQuestionsAndResponses.questionsWithResponses,
    questionsByChapter: POWERPOD.workbookQuestionsAndResponses.questionsByChapter,
    stats: POWERPOD.workbookQuestionsAndResponses.stats,
    isLoaded: POWERPOD.workbookQuestionsAndResponses.isLoaded,
    isLoading: POWERPOD.workbookQuestionsAndResponses.isLoading,
    workbookId: POWERPOD.workbookQuestionsAndResponses.workbookId,
    lastUpdated: POWERPOD.workbookQuestionsAndResponses.lastUpdated,
    error: POWERPOD.workbookQuestionsAndResponses.error
  };
}

/**
 * Get question and response data for a specific question
 * @param {string} questionId - The question ID
 * @returns {Object|null} Question and response data or null if not found
 */
export function getQuestionAndResponseFromMemory(questionId) {
  if (!POWERPOD.workbookQuestionsAndResponses.isLoaded) {
    logger.warn({
      fn: 'getQuestionAndResponseFromMemory',
      message: 'Questions and responses not loaded in memory',
      data: { questionId }
    });
    return null;
  }

  return POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.get(questionId) || null;
}

/**
 * Get questions and responses for a specific chapter
 * @param {string} chapterId - The chapter ID
 * @returns {Array} Array of question and response objects
 */
export function getChapterQuestionsAndResponsesFromMemory(chapterId) {
  if (!POWERPOD.workbookQuestionsAndResponses.isLoaded) {
    logger.warn({
      fn: 'getChapterQuestionsAndResponsesFromMemory',
      message: 'Questions and responses not loaded in memory',
      data: { chapterId }
    });
    return [];
  }

  return POWERPOD.workbookQuestionsAndResponses.questionsByChapter.get(chapterId) || [];
}

/**
 * Update response in the nested structure
 * @param {string} questionId - The question ID
 * @param {Object} responseData - The response data
 */
export function updateResponseInMemory(questionId, responseData) {
  if (!POWERPOD.workbookQuestionsAndResponses.isLoaded) {
    logger.warn({
      fn: 'updateResponseInMemory',
      message: 'Questions and responses not loaded in memory',
      data: { questionId }
    });
    return;
  }

  // Update in main structure
  const entry = POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.get(questionId);
  if (entry) {
    entry.response = responseData;
  } else {
    // Create new entry if question doesn't exist
    POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set(questionId, {
      question: null,
      response: responseData
    });
  }

  // Update in chapter structure
  POWERPOD.workbookQuestionsAndResponses.questionsByChapter.forEach((chapterQuestions) => {
    chapterQuestions.forEach(chapterEntry => {
      if (chapterEntry.question?.quartech_workbookquestionid === questionId) {
        chapterEntry.response = responseData;
      }
    });
  });

  // Update statistics
  updateQuestionsAndResponsesStats();

  // Update timestamp
  POWERPOD.workbookQuestionsAndResponses.lastUpdated = new Date().toISOString();

  logger.info({
    fn: 'updateResponseInMemory',
    message: `Updated response for question ${questionId} in memory`,
    data: { questionId, hasResponse: !!responseData }
  });

  // Also update questionnaire store if loaded
  if (isQuestionnaireLoaded() && responseData) {
    try {
      // Let updateQuestionResponse auto-calculate completion based on response content
      updateQuestionResponse(questionId, responseData.quartech_response, null, responseData);
      logger.info({
        fn: 'updateResponseInMemory',
        message: `Updated questionnaire store for question ${questionId}`
      });
    } catch (error) {
      logger.warn({
        fn: 'updateResponseInMemory',
        message: `Failed to update questionnaire store for question ${questionId}`,
        data: { error: error.message }
      });
    }
  }
}

/**
 * Remove response from the nested structure
 * @param {string} questionId - The question ID
 */
export function removeResponseFromMemory(questionId) {
  if (!POWERPOD.workbookQuestionsAndResponses.isLoaded) {
    logger.warn({
      fn: 'removeResponseFromMemory',
      message: 'Questions and responses not loaded in memory',
      data: { questionId }
    });
    return;
  }

  // Remove from main structure
  const entry = POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.get(questionId);
  if (entry) {
    entry.response = null;
  }

  // Remove from chapter structure
  POWERPOD.workbookQuestionsAndResponses.questionsByChapter.forEach((chapterQuestions) => {
    chapterQuestions.forEach(chapterEntry => {
      if (chapterEntry.question?.quartech_workbookquestionid === questionId) {
        chapterEntry.response = null;
      }
    });
  });

  // Update statistics
  updateQuestionsAndResponsesStats();

  // Update timestamp
  POWERPOD.workbookQuestionsAndResponses.lastUpdated = new Date().toISOString();

  logger.info({
    fn: 'removeResponseFromMemory',
    message: `Removed response for question ${questionId} from memory`,
    data: { questionId }
  });

  // Also update questionnaire store if loaded
  if (isQuestionnaireLoaded()) {
    try {
      updateQuestionResponse(questionId, null, false, null);
      logger.info({
        fn: 'removeResponseFromMemory',
        message: `Removed response from questionnaire store for question ${questionId}`
      });
    } catch (error) {
      logger.warn({
        fn: 'removeResponseFromMemory',
        message: `Failed to remove response from questionnaire store for question ${questionId}`,
        data: { error: error.message }
      });
    }
  }
}

/**
 * Update statistics for questions and responses
 * This function counts both answered and skipped questions as "complete"
 * Completion percentage = (answered + skipped) / total questions
 * A question is considered "answered" if it has a non-empty response value
 * A question is considered "skipped" if quartech_chapterskipped === 100000000
 */
export function updateQuestionsAndResponsesStats() {
  logger.info({
    fn: 'updateQuestionsAndResponsesStats',
    message: '🔄 updateQuestionsAndResponsesStats CALLED'
  });

  const questionsWithResponses = POWERPOD.workbookQuestionsAndResponses.questionsWithResponses;
  const totalQuestions = questionsWithResponses.size;

  // Count answered questions and skipped questions separately
  let answeredQuestions = 0;
  let skippedQuestions = 0;

  try {
    // Use imported questionnaire functions to check response data
    if (isQuestionnaireLoaded()) {
      // Count questions using questionnaire store data
      for (const [questionId, entry] of questionsWithResponses) {
        const question = getQuestionFromStore(questionId);

        // Check if skipped - use both entry.response and question.responseData for reliability
        // The entry.response is the source of truth from POWERPOD memory
        const isSkipped = entry?.response?.quartech_chapterskipped === 100000000 ||
                         question?.responseData?.quartech_chapterskipped === 100000000;

        if (isSkipped) {
          skippedQuestions++;
        } else {
          // Check if answered (has actual response content)
          // Use entry.response as primary source, fall back to question.responseData
          const responseValue = entry?.response?.quartech_response || question?.responseData?.quartech_response;
          const hasResponse = responseValue && responseValue.trim() !== '';
          if (hasResponse) {
            answeredQuestions++;
          }
        }
      }

      logger.info({
        fn: 'updateQuestionsAndResponsesStats',
        message: 'Using questionnaire store for completion stats',
        data: { totalQuestions, answeredQuestions, skippedQuestions }
      });
    } else {
      // Fallback to counting questions from response data
      Array.from(questionsWithResponses.values()).forEach(entry => {
        if (entry.response !== null) {
          // Check if skipped
          if (entry.response.quartech_chapterskipped === 100000000) {
            skippedQuestions++;
          }
          // Check if answered (has actual content)
          else if (entry.response.quartech_response &&
                   entry.response.quartech_response.trim() !== '') {
            answeredQuestions++;
          }
        }
      });

      logger.info({
        fn: 'updateQuestionsAndResponsesStats',
        message: 'Using response data for completion stats (questionnaire store not loaded)',
        data: { totalQuestions, answeredQuestions, skippedQuestions }
      });
    }
  } catch (error) {
    // Fallback to counting questions from response data if questionnaire store fails
    Array.from(questionsWithResponses.values()).forEach(entry => {
      if (entry.response !== null) {
        // Check if skipped
        if (entry.response.quartech_chapterskipped === 100000000) {
          skippedQuestions++;
        }
        // Check if answered (has actual content)
        else if (entry.response.quartech_response &&
                 entry.response.quartech_response.trim() !== '') {
          answeredQuestions++;
        }
      }
    });

    logger.warn({
      fn: 'updateQuestionsAndResponsesStats',
      message: 'Failed to use questionnaire store, falling back to response data',
      data: { error: error.message, totalQuestions, answeredQuestions, skippedQuestions }
    });
  }

  // Calculate completion percentage: both answered and skipped questions count as "complete"
  // completedQuestions = answered + skipped
  const completedQuestions = answeredQuestions + skippedQuestions;
  const nonSkippedTotal = totalQuestions - skippedQuestions;
  const unansweredQuestions = totalQuestions - completedQuestions;
  const completionPercentage = totalQuestions > 0 ?
    Math.round((completedQuestions / totalQuestions) * 100) : 0;

  logger.info({
    fn: 'updateQuestionsAndResponsesStats',
    message: `🧮 Calculated stats: ${answeredQuestions} answered + ${skippedQuestions} skipped = ${completedQuestions} complete out of ${totalQuestions} total = ${completionPercentage}%`,
    data: {
      totalQuestions,
      answeredQuestions,
      skippedQuestions,
      completedQuestions,
      unansweredQuestions,
      completionPercentage
    }
  });

  POWERPOD.workbookQuestionsAndResponses.stats = {
    totalQuestions,
    answeredQuestions,
    skippedQuestions,
    unansweredQuestions,
    nonSkippedTotal,
    completionPercentage,
    lastUpdated: new Date().toISOString()
  };

  // Trigger UI update by dispatching a custom event
  // This allows the EFPEntryForm component to re-render when stats change
  try {
    const event = new CustomEvent('workbook-stats-updated', {
      detail: {
        totalQuestions,
        answeredQuestions,
        skippedQuestions,
        unansweredQuestions,
        nonSkippedTotal,
        completionPercentage
      },
      bubbles: true,
      composed: true
    });

    // Dispatch the event on the EFP entry form element if it exists
    const efpEntryForm = document.querySelector('efp-entry-form');
    if (efpEntryForm) {
      logger.info({
        fn: 'updateQuestionsAndResponsesStats',
        message: `🔔 DISPATCHING workbook-stats-updated event with ${completionPercentage}% complete`,
        data: {
          totalQuestions,
          answeredQuestions,
          skippedQuestions,
          completedQuestions,
          unansweredQuestions,
          nonSkippedTotal,
          completionPercentage
        }
      });
      efpEntryForm.dispatchEvent(event);
      logger.info({
        fn: 'updateQuestionsAndResponsesStats',
        message: `✅ Event dispatched successfully`,
      });
    } else {
      logger.warn({
        fn: 'updateQuestionsAndResponsesStats',
        message: `❌ Could not find efp-entry-form element to dispatch event`,
      });
    }
  } catch (error) {
    logger.warn({
      fn: 'updateQuestionsAndResponsesStats',
      message: 'Failed to dispatch stats update event',
      data: { error: error.message }
    });
  }
}

/**
 * Clear questions and responses from memory
 */
export function clearQuestionsAndResponsesMemory() {
  logger.info({
    fn: 'clearQuestionsAndResponsesMemory',
    message: 'Clearing questions and responses from memory'
  });

  POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.clear();
  POWERPOD.workbookQuestionsAndResponses.questionsByChapter.clear();
  POWERPOD.workbookQuestionsAndResponses.stats = {
    totalQuestions: 0,
    answeredQuestions: 0,
    skippedQuestions: 0,
    unansweredQuestions: 0,
    nonSkippedTotal: 0,
    completionPercentage: 0,
    lastUpdated: null
  };
  POWERPOD.workbookQuestionsAndResponses.isLoaded = false;
  POWERPOD.workbookQuestionsAndResponses.isLoading = false;
  POWERPOD.workbookQuestionsAndResponses.workbookId = null;
  POWERPOD.workbookQuestionsAndResponses.lastUpdated = null;
  POWERPOD.workbookQuestionsAndResponses.error = null;
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
  // Questions and responses nested structure functions
  loadQuestionsAndResponses,
  getQuestionsAndResponsesFromMemory,
  getQuestionAndResponseFromMemory,
  getChapterQuestionsAndResponsesFromMemory,
  updateResponseInMemory,
  removeResponseFromMemory,
  clearQuestionsAndResponsesMemory,
};

export default WorkbookResponseHelper;

POWERPOD.workbookResponseHelper = WorkbookResponseHelper;
