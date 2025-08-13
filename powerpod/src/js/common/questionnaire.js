import { POWERPOD } from './constants.js';
import { Logger } from './logger.js';
import store from '../store/index.js';

const logger = Logger('common/questionnaire');

/**
 * Load questionnaire data into the store from the nested chapter structure
 * @param {Array} nestedChapterStructure - The nested chapter structure from the API
 * @param {boolean} forceRefresh - Whether to force refresh the data
 * @returns {Object} The questionnaire data
 */
export function loadQuestionnaireIntoStore(nestedChapterStructure, forceRefresh = false) {
  logger.info({
    fn: loadQuestionnaireIntoStore,
    message: 'Loading questionnaire data into store',
    data: { 
      chaptersCount: nestedChapterStructure?.length || 0,
      forceRefresh 
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

  // Transform the nested structure to match our store format
  const questionnaireData = {
    title: "Environmental Farm Plan Questionnaire",
    chapters: [nestedChapterStructure] // Wrap in array to match the example structure
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
 */
export function updateQuestionResponse(questionId, response, complete = true) {
  logger.info({
    fn: updateQuestionResponse,
    message: 'Updating question response',
    data: { questionId, response, complete },
  });

  store.dispatch('updateQuestionnaireQuestion', {
    questionId,
    updateData: { response, complete }
  });
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
 * Check if questionnaire data is loaded in the store
 * @returns {boolean} True if questionnaire data is loaded
 */
export function isQuestionnaireLoaded() {
  return !!(POWERPOD.state?.questionnaire?.chapters?.length > 0);
}
