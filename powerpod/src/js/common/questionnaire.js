import { POWERPOD } from './constants.js';
import { Logger } from './logger.js';
import store from '../store/index.js';

const logger = Logger('common/questionnaire');

/**
 * Merge response data with questions in the nested chapter structure
 * @param {Array} nestedChapterStructure - The nested chapter structure
 * @param {Object} responseData - Response data from workbookQuestionsAndResponses
 * @returns {Array} Enhanced structure with response data
 */
function mergeResponsesWithQuestions(nestedChapterStructure, responseData) {
  logger.info({
    fn: mergeResponsesWithQuestions,
    message: 'Merging response data with questions',
    data: {
      chaptersCount: nestedChapterStructure?.length || 0,
      hasResponseData: !!responseData
    },
  });

  if (!responseData || !responseData.questionsWithResponses) {
    logger.warn({
      fn: mergeResponsesWithQuestions,
      message: 'No response data provided, returning original structure'
    });
    return nestedChapterStructure;
  }

  const questionsWithResponses = responseData.questionsWithResponses;

  // Deep clone the structure to avoid mutating the original
  const enhancedStructure = JSON.parse(JSON.stringify(nestedChapterStructure));

  logger.info({
    fn: mergeResponsesWithQuestions,
    message: 'Starting to merge responses with questions',
    data: {
      totalResponseEntries: questionsWithResponses.size,
      structureType: typeof enhancedStructure
    }
  });

  // Recursive function to enhance questions with response data
  const enhanceQuestionsInChapters = (chapters) => {
    if (!Array.isArray(chapters)) return;

    chapters.forEach(chapter => {
      // Enhance questions in main chapter
      if (chapter.questions && Array.isArray(chapter.questions)) {
        chapter.questions.forEach(question => {
          const responseEntry = questionsWithResponses.get(question.id);
          if (responseEntry && responseEntry.response) {
            question.response = responseEntry.response.quartech_response;
            question.responseData = responseEntry.response;
            question.complete = true;
            question.hasResponse = true;

            logger.info({
              fn: mergeResponsesWithQuestions,
              message: `Merged response for question ${question.id}`,
              data: {
                questionId: question.id,
                response: question.response,
                hasResponseData: !!question.responseData
              }
            });
          } else {
            question.response = null;
            question.responseData = null;
            question.complete = false;
            question.hasResponse = false;
          }
        });
      }

      // Enhance questions in subchapters recursively
      if (chapter.subchapters && Array.isArray(chapter.subchapters)) {
        enhanceQuestionsInChapters(chapter.subchapters);
      }
    });
  };

  enhanceQuestionsInChapters(enhancedStructure);

  // Count how many questions got responses
  let questionsWithResponsesCount = 0;
  let totalQuestionsCount = 0;

  const countQuestions = (chapters) => {
    if (!Array.isArray(chapters)) return;

    chapters.forEach(chapter => {
      if (chapter.questions && Array.isArray(chapter.questions)) {
        totalQuestionsCount += chapter.questions.length;
        questionsWithResponsesCount += chapter.questions.filter(q => q.hasResponse).length;
      }
      if (chapter.subchapters && Array.isArray(chapter.subchapters)) {
        countQuestions(chapter.subchapters);
      }
    });
  };

  countQuestions(enhancedStructure);

  logger.info({
    fn: mergeResponsesWithQuestions,
    message: 'Successfully merged response data with questions',
    data: {
      totalQuestions: totalQuestionsCount,
      questionsWithResponses: questionsWithResponsesCount,
      mergePercentage: totalQuestionsCount > 0 ? Math.round((questionsWithResponsesCount / totalQuestionsCount) * 100) : 0
    }
  });

  return enhancedStructure;
}

/**
 * Load questionnaire data into the store from the nested chapter structure
 * @param {Array} nestedChapterStructure - The nested chapter structure from the API
 * @param {boolean} forceRefresh - Whether to force refresh the data
 * @param {Object} responseData - Optional response data to merge with questions
 * @returns {Object} The questionnaire data
 */
export function loadQuestionnaireIntoStore(nestedChapterStructure, forceRefresh = false, responseData = null) {
  logger.info({
    fn: loadQuestionnaireIntoStore,
    message: 'Loading questionnaire data into store',
    data: {
      chaptersCount: nestedChapterStructure?.length || 0,
      forceRefresh,
      hasResponseData: !!responseData
    },
  });

  // Check if already loaded unless forceRefresh is true
  if (!forceRefresh && POWERPOD.state?.questionnaire?.chapters?.length > 0) {
    logger.info({
      fn: loadQuestionnaireIntoStore,
      message: 'Questionnaire data already loaded in store',
      data: { questionnaire: POWERPOD.state.questionnaire },
    });
    return POWERPOD.state.questionnaire;
  }

  // Merge response data with questions if provided
  let enrichedStructure = nestedChapterStructure;
  if (responseData) {
    enrichedStructure = mergeResponsesWithQuestions(nestedChapterStructure, responseData);
  }

  // Transform the nested structure to match our store format
  const questionnaireData = {
    title: "Environmental Farm Plan Questionnaire",
    chapters: [enrichedStructure] // Wrap in array to match the example structure
  };

  // Dispatch to store
  store.dispatch('setQuestionnaireData', { questionnaire: questionnaireData });

  logger.info({
    fn: loadQuestionnaireIntoStore,
    message: 'Successfully loaded questionnaire data into store',
    data: { questionnaire: questionnaireData },
  });

  return questionnaireData;
}

/**
 * Get questionnaire data from store
 * @returns {Object|null} The questionnaire data or null if not loaded
 */
export function getQuestionnaireFromStore() {
  if (!POWERPOD.state?.questionnaire) {
    logger.warn({
      fn: getQuestionnaireFromStore,
      message: 'Questionnaire data not found in store',
    });
    return null;
  }

  return POWERPOD.state.questionnaire;
}

/**
 * Get a specific chapter by ID from the store
 * @param {string} chapterId - The chapter ID to find
 * @returns {Object|null} The chapter object or null if not found
 */
export function getChapterFromStore(chapterId) {
  const questionnaire = getQuestionnaireFromStore();
  if (!questionnaire?.chapters) {
    return null;
  }

  // Search through the nested structure
  const findChapterInArray = (chapters) => {
    for (const chapterGroup of chapters) {
      if (Array.isArray(chapterGroup)) {
        for (const chapter of chapterGroup) {
          if (chapter.id === chapterId) {
            return chapter;
          }
          // Check subchapters
          if (chapter.subchapters) {
            const found = findChapterInArray([chapter.subchapters]);
            if (found) return found;
          }
        }
      }
    }
    return null;
  };

  return findChapterInArray(questionnaire.chapters);
}

/**
 * Get a specific question by ID from the store
 * @param {string} questionId - The question ID to find
 * @returns {Object|null} The question object or null if not found
 */
export function getQuestionFromStore(questionId) {
  const questionnaire = getQuestionnaireFromStore();
  if (!questionnaire?.chapters) {
    return null;
  }

  // Search through the nested structure
  const findQuestionInChapters = (chapters) => {
    for (const chapterGroup of chapters) {
      if (Array.isArray(chapterGroup)) {
        for (const chapter of chapterGroup) {
          // Check questions in main chapter
          if (chapter.questions) {
            const question = chapter.questions.find(q => q.id === questionId);
            if (question) return question;
          }
          // Check questions in subchapters
          if (chapter.subchapters) {
            const found = findQuestionInChapters([chapter.subchapters]);
            if (found) return found;
          }
        }
      }
    }
    return null;
  };

  return findQuestionInChapters(questionnaire.chapters);
}

/**
 * Update a chapter's completion status
 * @param {string} chapterId - The chapter ID to update
 * @param {boolean} complete - The completion status
 */
export function updateChapterCompletion(chapterId, complete) {
  logger.info({
    fn: updateChapterCompletion,
    message: 'Updating chapter completion status',
    data: { chapterId, complete },
  });

  store.dispatch('updateQuestionnaireChapter', {
    chapterId,
    updateData: { complete }
  });
}

/**
 * Update a question's response
 * @param {string} questionId - The question ID to update
 * @param {any} response - The response value
 * @param {boolean} complete - Whether the question is complete
 * @param {Object} responseData - Full response data object (optional)
 */
export function updateQuestionResponse(questionId, response, complete = true, responseData = null) {
  logger.info({
    fn: updateQuestionResponse,
    message: 'Updating question response',
    data: { questionId, response, complete, hasResponseData: !!responseData },
  });

  const updateData = {
    response,
    complete,
    hasResponse: !!response
  };

  // Include full response data if provided
  if (responseData) {
    updateData.responseData = responseData;
  }

  store.dispatch('updateQuestionnaireQuestion', {
    questionId,
    updateData
  });

  // Also update the POWERPOD workbookQuestionsAndResponses if it exists
  if (POWERPOD.workbookQuestionsAndResponses.isLoaded) {
    const entry = POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.get(questionId);
    if (entry && responseData) {
      entry.response = responseData;
    }
  }
}

/**
 * Get all questions for a specific chapter
 * @param {string} chapterId - The chapter ID
 * @returns {Array} Array of questions for the chapter
 */
export function getQuestionsForChapter(chapterId) {
  const chapter = getChapterFromStore(chapterId);
  if (!chapter) {
    return [];
  }

  let questions = [...(chapter.questions || [])];

  // Also collect questions from subchapters
  if (chapter.subchapters) {
    const collectQuestionsFromSubchapters = (subchapters) => {
      for (const subchapter of subchapters) {
        questions = questions.concat(subchapter.questions || []);
        if (subchapter.subchapters) {
          collectQuestionsFromSubchapters(subchapter.subchapters);
        }
      }
    };
    collectQuestionsFromSubchapters(chapter.subchapters);
  }

  return questions;
}

/**
 * Get completion statistics for the questionnaire
 * @returns {Object} Statistics about questionnaire completion
 */
export function getQuestionnaireStats() {
  const questionnaire = getQuestionnaireFromStore();
  if (!questionnaire?.chapters) {
    return {
      totalQuestions: 0,
      answeredQuestions: 0,
      completionPercentage: 0,
      totalChapters: 0,
      completedChapters: 0
    };
  }

  let totalQuestions = 0;
  let answeredQuestions = 0;
  let totalChapters = 0;
  let completedChapters = 0;

  const countInChapters = (chapters) => {
    for (const chapterGroup of chapters) {
      if (Array.isArray(chapterGroup)) {
        for (const chapter of chapterGroup) {
          totalChapters++;
          if (chapter.complete) {
            completedChapters++;
          }

          // Count questions in main chapter
          if (chapter.questions) {
            totalQuestions += chapter.questions.length;
            answeredQuestions += chapter.questions.filter(q => q.complete).length;
          }

          // Count questions in subchapters
          if (chapter.subchapters) {
            countInChapters([chapter.subchapters]);
          }
        }
      }
    }
  };

  countInChapters(questionnaire.chapters);

  return {
    totalQuestions,
    answeredQuestions,
    completionPercentage: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0,
    totalChapters,
    completedChapters
  };
}

/**
 * Load questionnaire data with responses into the store
 * @param {Array} nestedChapterStructure - The nested chapter structure from the API
 * @param {string} workbookId - The workbook ID to load responses for
 * @param {boolean} forceRefresh - Whether to force refresh the data
 * @returns {Promise<Object>} The questionnaire data with responses
 */
export async function loadQuestionnaireWithResponses(nestedChapterStructure, workbookId, forceRefresh = false) {
  logger.info({
    fn: loadQuestionnaireWithResponses,
    message: 'Loading questionnaire data with responses into store',
    data: {
      chaptersCount: nestedChapterStructure?.length || 0,
      workbookId,
      forceRefresh
    },
  });

  try {
    // Always load fresh response data to ensure we have all responses
    let responseData = null;
    if (workbookId) {
      logger.info({
        fn: loadQuestionnaireWithResponses,
        message: 'Loading all response data from API for questionnaire integration'
      });

      // Import the response helper dynamically to avoid circular imports
      const { loadQuestionsAndResponses } = await import('./workbookResponseHelper.js');
      responseData = await loadQuestionsAndResponses(workbookId);

      logger.info({
        fn: loadQuestionnaireWithResponses,
        message: 'Successfully loaded response data',
        data: {
          totalQuestions: responseData?.stats?.totalQuestions || 0,
          answeredQuestions: responseData?.stats?.answeredQuestions || 0,
          completionPercentage: responseData?.stats?.completionPercentage || 0
        }
      });
    }

    // Load questionnaire with response data merged in
    const questionnaireData = loadQuestionnaireIntoStore(nestedChapterStructure, forceRefresh, responseData);

    logger.info({
      fn: loadQuestionnaireWithResponses,
      message: 'Successfully loaded questionnaire with all responses into store',
      data: {
        hasResponses: !!responseData,
        workbookId,
        responseStats: responseData?.stats
      }
    });

    return questionnaireData;

  } catch (error) {
    logger.error({
      fn: loadQuestionnaireWithResponses,
      message: 'Failed to load questionnaire with responses',
      data: { error: error.message, workbookId }
    });

    // Fallback to loading without responses
    logger.info({
      fn: loadQuestionnaireWithResponses,
      message: 'Falling back to loading questionnaire without responses'
    });
    return loadQuestionnaireIntoStore(nestedChapterStructure, forceRefresh);
  }
}

/**
 * Refresh questionnaire store with latest response data
 * @param {string} workbookId - The workbook ID to refresh responses for
 * @returns {Promise<boolean>} True if refresh was successful
 */
export async function refreshQuestionnaireResponses(workbookId) {
  logger.info({
    fn: refreshQuestionnaireResponses,
    message: 'Refreshing questionnaire responses from latest data',
    data: { workbookId }
  });

  try {
    const questionnaire = getQuestionnaireFromStore();
    if (!questionnaire?.chapters?.length) {
      logger.warn({
        fn: refreshQuestionnaireResponses,
        message: 'No questionnaire data loaded, cannot refresh responses'
      });
      return false;
    }

    // Get the original nested structure (without responses)
    const originalStructure = questionnaire.chapters[0];

    // Load fresh response data
    const { loadQuestionsAndResponses } = await import('./workbookResponseHelper.js');
    const responseData = await loadQuestionsAndResponses(workbookId);

    // Reload questionnaire with fresh responses
    loadQuestionnaireIntoStore(originalStructure, true, responseData);

    logger.info({
      fn: refreshQuestionnaireResponses,
      message: 'Successfully refreshed questionnaire responses'
    });

    return true;

  } catch (error) {
    logger.error({
      fn: refreshQuestionnaireResponses,
      message: 'Failed to refresh questionnaire responses',
      data: { error: error.message, workbookId }
    });
    return false;
  }
}

/**
 * Check if questionnaire data is loaded in the store
 * @returns {boolean} True if questionnaire data is loaded
 */
export function isQuestionnaireLoaded() {
  return !!(POWERPOD.state?.questionnaire?.chapters?.length > 0);
}
