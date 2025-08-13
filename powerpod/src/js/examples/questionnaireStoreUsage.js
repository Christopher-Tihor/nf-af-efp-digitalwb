/**
 * Example usage of the questionnaire store
 * This demonstrates how to use the new questionnaire state management
 */

import { 
  loadQuestionnaireIntoStore,
  getQuestionnaireFromStore,
  getChapterFromStore,
  getQuestionFromStore,
  updateChapterCompletion,
  updateQuestionResponse,
  getQuestionsForChapter,
  getQuestionnaireStats,
  isQuestionnaireLoaded
} from '../common/questionnaire.js';
import { POWERPOD } from '../common/constants.js';
import { Logger } from '../common/logger.js';

const logger = Logger('examples/questionnaireStoreUsage');

/**
 * Example: Load questionnaire data into the store
 */
export function exampleLoadQuestionnaire() {
  logger.info({
    fn: exampleLoadQuestionnaire,
    message: 'Loading example questionnaire data into store'
  });

  // Example nested chapter structure (this would normally come from the API)
  const exampleNestedStructure = [
    {
      id: "chapter-1",
      name: "Chapter 1: Farm Overview",
      label: "Farm Overview",
      order: 1,
      complete: false,
      description: "Basic information about your farm",
      questions: [
        {
          id: "question-1-1",
          name: "Farm Size",
          label: "What is the total size of your farm?",
          order: 1,
          questionType: 100000001,
          complete: false,
          response: null
        }
      ],
      subchapters: [
        {
          id: "subchapter-1-1",
          name: "Location Details",
          label: "Farm Location",
          order: 1.1,
          complete: false,
          parentChapterId: "chapter-1",
          questions: [
            {
              id: "question-1-1-1",
              name: "Farm Address",
              label: "What is your farm's address?",
              order: 1,
              questionType: 100000001,
              complete: false,
              response: null
            }
          ],
          subchapters: []
        }
      ]
    }
  ];

  // Load into store
  const result = loadQuestionnaireIntoStore(exampleNestedStructure);
  
  logger.info({
    fn: exampleLoadQuestionnaire,
    message: 'Successfully loaded questionnaire into store',
    data: { result }
  });

  return result;
}

/**
 * Example: Get questionnaire data from store
 */
export function exampleGetQuestionnaire() {
  logger.info({
    fn: exampleGetQuestionnaire,
    message: 'Getting questionnaire data from store'
  });

  const questionnaire = getQuestionnaireFromStore();
  
  if (questionnaire) {
    logger.info({
      fn: exampleGetQuestionnaire,
      message: 'Retrieved questionnaire from store',
      data: { 
        title: questionnaire.title,
        chaptersCount: questionnaire.chapters?.length || 0
      }
    });
  } else {
    logger.warn({
      fn: exampleGetQuestionnaire,
      message: 'No questionnaire data found in store'
    });
  }

  return questionnaire;
}

/**
 * Example: Get a specific chapter
 */
export function exampleGetChapter(chapterId = "chapter-1") {
  logger.info({
    fn: exampleGetChapter,
    message: `Getting chapter ${chapterId} from store`
  });

  const chapter = getChapterFromStore(chapterId);
  
  if (chapter) {
    logger.info({
      fn: exampleGetChapter,
      message: 'Retrieved chapter from store',
      data: { 
        id: chapter.id,
        name: chapter.name,
        questionsCount: chapter.questions?.length || 0,
        subchaptersCount: chapter.subchapters?.length || 0
      }
    });
  } else {
    logger.warn({
      fn: exampleGetChapter,
      message: `Chapter ${chapterId} not found in store`
    });
  }

  return chapter;
}

/**
 * Example: Update a question response
 */
export function exampleUpdateQuestionResponse(questionId = "question-1-1", response = "100 acres") {
  logger.info({
    fn: exampleUpdateQuestionResponse,
    message: `Updating response for question ${questionId}`
  });

  updateQuestionResponse(questionId, response, true);
  
  // Verify the update
  const question = getQuestionFromStore(questionId);
  if (question) {
    logger.info({
      fn: exampleUpdateQuestionResponse,
      message: 'Question response updated successfully',
      data: { 
        questionId,
        response: question.response,
        complete: question.complete
      }
    });
  }

  return question;
}

/**
 * Example: Update chapter completion
 */
export function exampleUpdateChapterCompletion(chapterId = "chapter-1", complete = true) {
  logger.info({
    fn: exampleUpdateChapterCompletion,
    message: `Updating completion status for chapter ${chapterId}`
  });

  updateChapterCompletion(chapterId, complete);
  
  // Verify the update
  const chapter = getChapterFromStore(chapterId);
  if (chapter) {
    logger.info({
      fn: exampleUpdateChapterCompletion,
      message: 'Chapter completion updated successfully',
      data: { 
        chapterId,
        complete: chapter.complete
      }
    });
  }

  return chapter;
}

/**
 * Example: Get questionnaire statistics
 */
export function exampleGetStats() {
  logger.info({
    fn: exampleGetStats,
    message: 'Getting questionnaire statistics'
  });

  const stats = getQuestionnaireStats();
  
  logger.info({
    fn: exampleGetStats,
    message: 'Retrieved questionnaire statistics',
    data: stats
  });

  return stats;
}

/**
 * Example: Check if questionnaire is loaded
 */
export function exampleCheckLoaded() {
  const loaded = isQuestionnaireLoaded();
  
  logger.info({
    fn: exampleCheckLoaded,
    message: `Questionnaire loaded status: ${loaded}`
  });

  return loaded;
}

/**
 * Run all examples
 */
export function runAllExamples() {
  logger.info({
    fn: runAllExamples,
    message: 'Running all questionnaire store examples'
  });

  console.log('=== Questionnaire Store Examples ===');
  
  // 1. Check if loaded
  console.log('1. Checking if questionnaire is loaded...');
  const initialLoaded = exampleCheckLoaded();
  
  // 2. Load questionnaire if not loaded
  if (!initialLoaded) {
    console.log('2. Loading questionnaire data...');
    exampleLoadQuestionnaire();
  }
  
  // 3. Get questionnaire
  console.log('3. Getting questionnaire data...');
  exampleGetQuestionnaire();
  
  // 4. Get a chapter
  console.log('4. Getting a specific chapter...');
  exampleGetChapter();
  
  // 5. Update question response
  console.log('5. Updating a question response...');
  exampleUpdateQuestionResponse();
  
  // 6. Update chapter completion
  console.log('6. Updating chapter completion...');
  exampleUpdateChapterCompletion();
  
  // 7. Get statistics
  console.log('7. Getting questionnaire statistics...');
  exampleGetStats();
  
  console.log('=== Examples completed ===');
  
  // Return current state for inspection
  return {
    questionnaire: getQuestionnaireFromStore(),
    stats: getQuestionnaireStats(),
    storeState: POWERPOD.state?.questionnaire
  };
}

// Auto-run examples if this file is imported
// Uncomment the line below to automatically run examples when this file is loaded
// setTimeout(runAllExamples, 1000);
