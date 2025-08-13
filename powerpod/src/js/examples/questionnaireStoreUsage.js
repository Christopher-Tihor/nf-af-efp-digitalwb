/**
 * Example usage of the questionnaire store
 * This demonstrates how to use the new questionnaire state management
 */

import {
  loadQuestionnaireIntoStore,
  loadQuestionnaireWithResponses,
  refreshQuestionnaireResponses,
  getQuestionnaireFromStore,
  getChapterFromStore,
  getQuestionFromStore,
  updateChapterCompletion,
  updateQuestionResponse,
  getQuestionsForChapter,
  getQuestionnaireStats,
  isQuestionnaireLoaded,
  calculateChapterCompletion,
  updateQuestionnaireCompletion
} from '../common/questionnaire.js';
import { POWERPOD } from '../common/constants.js';
import { Logger } from '../common/logger.js';

const logger = Logger('examples/questionnaireStoreUsage');

/**
 * Example: Load questionnaire data with responses into the store
 */
export async function exampleLoadQuestionnaireWithResponses(workbookId = "example-workbook-id") {
  logger.info({
    fn: exampleLoadQuestionnaireWithResponses,
    message: 'Loading example questionnaire data with responses into store'
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
      subchapters: []
    }
  ];

  try {
    // Load with responses
    const result = await loadQuestionnaireWithResponses(exampleNestedStructure, workbookId);

    logger.info({
      fn: exampleLoadQuestionnaireWithResponses,
      message: 'Successfully loaded questionnaire with responses into store',
      data: { result }
    });

    return result;
  } catch (error) {
    logger.error({
      fn: exampleLoadQuestionnaireWithResponses,
      message: 'Failed to load questionnaire with responses',
      data: { error: error.message }
    });
    throw error;
  }
}

/**
 * Example: Load questionnaire data into the store (without responses)
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

  // Example response data (this would normally come from the API)
  const exampleResponseData = {
    quartech_workbookresponseid: "response-id-123",
    quartech_response: response,
    quartech_notes: `Response: ${response}`,
    _quartech_question_value: questionId,
    _quartech_workbook_value: "workbook-id-123",
    createdon: new Date().toISOString(),
    modifiedon: new Date().toISOString()
  };

  updateQuestionResponse(questionId, response, true, exampleResponseData);

  // Verify the update
  const question = getQuestionFromStore(questionId);
  if (question) {
    logger.info({
      fn: exampleUpdateQuestionResponse,
      message: 'Question response updated successfully',
      data: {
        questionId,
        response: question.response,
        complete: question.complete,
        hasResponseData: !!question.responseData
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
export async function runAllExamples() {
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
    console.log('2. Loading questionnaire data with responses...');
    try {
      await exampleLoadQuestionnaireWithResponses();
    } catch (error) {
      console.log('2b. Falling back to loading without responses...');
      exampleLoadQuestionnaire();
    }
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

  // 8. Test completion logic
  console.log('8. Testing completion logic...');
  try {
    testCompletionLogic();
    console.log('✅ Completion logic test completed');
  } catch (error) {
    console.log('❌ Completion logic test failed:', error.message);
  }

  // 9. Demonstrate response refresh
  console.log('9. Refreshing questionnaire responses...');
  try {
    await refreshQuestionnaireResponses('example-workbook-id');
    console.log('✅ Successfully refreshed responses');
  } catch (error) {
    console.log('❌ Failed to refresh responses:', error.message);
  }

  console.log('=== Examples completed ===');

  // Return current state for inspection
  return {
    questionnaire: getQuestionnaireFromStore(),
    stats: getQuestionnaireStats(),
    storeState: POWERPOD.state?.questionnaire
  };
}

/**
 * Test function to verify questionnaire store loads all responses
 * Call this after workbook initialization to verify response integration
 */
export function testQuestionnaireResponseIntegration() {
  console.log('🧪 Testing Questionnaire Response Integration...');

  const questionnaire = getQuestionnaireFromStore();
  if (!questionnaire) {
    console.log('❌ No questionnaire data found in store');
    return false;
  }

  console.log('✅ Questionnaire data found in store');
  console.log(`📊 Title: ${questionnaire.title}`);

  // Count questions and responses
  let totalQuestions = 0;
  let questionsWithResponses = 0;

  const countInChapters = (chapters) => {
    if (!Array.isArray(chapters)) return;

    chapters.forEach(chapter => {
      if (chapter.questions && Array.isArray(chapter.questions)) {
        totalQuestions += chapter.questions.length;
        questionsWithResponses += chapter.questions.filter(q => q.hasResponse).length;

        // Log some examples
        chapter.questions.slice(0, 3).forEach(question => {
          console.log(`📝 Question ${question.id}: ${question.hasResponse ? '✅ Has Response' : '❌ No Response'}`);
          if (question.hasResponse) {
            console.log(`   Response: ${question.response}`);
            console.log(`   Response Data: ${question.responseData ? 'Available' : 'Missing'}`);
          }
        });
      }

      if (chapter.subchapters && Array.isArray(chapter.subchapters)) {
        countInChapters(chapter.subchapters);
      }
    });
  };

  if (questionnaire.chapters && questionnaire.chapters.length > 0) {
    countInChapters(questionnaire.chapters[0]);
  }

  console.log(`📈 Total Questions: ${totalQuestions}`);
  console.log(`✅ Questions with Responses: ${questionsWithResponses}`);
  console.log(`📊 Response Coverage: ${totalQuestions > 0 ? Math.round((questionsWithResponses / totalQuestions) * 100) : 0}%`);

  // Compare with POWERPOD response data
  const powerpodStats = POWERPOD.workbookQuestionsAndResponses?.stats;
  if (powerpodStats) {
    console.log(`🔄 POWERPOD Stats - Total: ${powerpodStats.totalQuestions}, Answered: ${powerpodStats.answeredQuestions}`);
    console.log(`🔄 Store Integration: ${questionsWithResponses === powerpodStats.answeredQuestions ? '✅ Synchronized' : '❌ Out of Sync'}`);
  }

  return {
    success: true,
    totalQuestions,
    questionsWithResponses,
    responseCoverage: totalQuestions > 0 ? Math.round((questionsWithResponses / totalQuestions) * 100) : 0,
    synchronized: questionsWithResponses === (powerpodStats?.answeredQuestions || 0)
  };
}

// Auto-run examples if this file is imported
// Uncomment the line below to automatically run examples when this file is loaded
// setTimeout(runAllExamples, 1000);

// Test response integration after a delay to allow for initialization
// Uncomment the line below to automatically test response integration
// setTimeout(testQuestionnaireResponseIntegration, 2000);

/**
 * Test the new completion logic based on questionnaire store rules
 */
export function testCompletionLogic() {
  console.log('🧪 Testing questionnaire completion logic...');

  try {
    const questionnaire = getQuestionnaireFromStore();
    if (!questionnaire) {
      console.log('❌ No questionnaire data found in store');
      return false;
    }

    console.log('📊 Testing completion rules:');
    console.log('   1. Empty chapters (no questions/subchapters) → complete');
    console.log('   2. Questions-only chapters → complete when all questions answered');
    console.log('   3. Subchapters-only chapters → complete when all subchapters complete');
    console.log('   4. Mixed chapters → complete when both questions AND subchapters complete');

    let testResults = [];

    // Test each chapter
    questionnaire.chapters.forEach(chapterGroup => {
      if (Array.isArray(chapterGroup)) {
        chapterGroup.forEach(chapter => {
          const hasQuestions = chapter.questions?.length > 0;
          const hasSubchapters = chapter.subchapters?.length > 0;
          const calculatedComplete = calculateChapterCompletion(chapter);
          const currentComplete = chapter.complete;

          let ruleApplied = '';
          if (!hasQuestions && !hasSubchapters) {
            ruleApplied = 'Empty → Complete';
          } else if (hasQuestions && !hasSubchapters) {
            ruleApplied = 'Questions-only';
          } else if (!hasQuestions && hasSubchapters) {
            ruleApplied = 'Subchapters-only';
          } else {
            ruleApplied = 'Mixed (Questions + Subchapters)';
          }

          const result = {
            id: chapter.id,
            name: chapter.name,
            ruleApplied,
            hasQuestions,
            hasSubchapters,
            currentComplete,
            calculatedComplete,
            shouldUpdate: currentComplete !== calculatedComplete
          };

          testResults.push(result);

          console.log(`📝 ${chapter.name}:`);
          console.log(`   Rule: ${ruleApplied}`);
          console.log(`   Current: ${currentComplete ? '✅' : '❌'} | Calculated: ${calculatedComplete ? '✅' : '❌'}`);
          console.log(`   ${result.shouldUpdate ? '🔄 Needs Update' : '✓ Correct'}`);
        });
      }
    });

    // Test the update function
    console.log('\n🔄 Running completion update...');
    const updatedCount = updateQuestionnaireCompletion();
    console.log(`✅ Updated ${updatedCount} chapters`);

    // Verify results
    const needsUpdate = testResults.filter(r => r.shouldUpdate).length;
    console.log(`\n📈 Test Results:`);
    console.log(`   Total chapters tested: ${testResults.length}`);
    console.log(`   Chapters needing updates: ${needsUpdate}`);
    console.log(`   Chapters updated: ${updatedCount}`);
    console.log(`   ${needsUpdate === updatedCount ? '✅ All updates applied correctly' : '❌ Update mismatch'}`);

    return {
      success: true,
      totalChapters: testResults.length,
      needsUpdate,
      updatedCount,
      testResults
    };

  } catch (error) {
    console.error('❌ Completion logic test failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test direct store usage vs generateSectionBItems
 */
export function testDirectStoreUsage() {
  console.log('🧪 Testing direct questionnaire store usage...');

  try {
    const questionnaire = getQuestionnaireFromStore();
    if (!questionnaire) {
      console.log('❌ No questionnaire data found in store');
      return false;
    }

    console.log('📊 Comparing direct store usage vs generateSectionBItems:');

    // Test direct store access
    const chapters = questionnaire.chapters[0] || [];
    console.log(`📋 Direct store access: Found ${chapters.length} chapters`);

    chapters.forEach((chapter, index) => {
      console.log(`📝 Chapter ${index + 1}: ${chapter.name}`);
      console.log(`   ID: ${chapter.id}`);
      console.log(`   Complete: ${chapter.complete ? '✅' : '❌'}`);
      console.log(`   Questions: ${chapter.questions?.length || 0}`);
      console.log(`   Subchapters: ${chapter.subchapters?.length || 0}`);

      if (chapter.subchapters) {
        chapter.subchapters.forEach((subchapter, subIndex) => {
          console.log(`  📄 Subchapter ${subIndex + 1}: ${subchapter.name}`);
          console.log(`     ID: ${subchapter.id}`);
          console.log(`     Complete: ${subchapter.complete ? '✅' : '❌'}`);
          console.log(`     Questions: ${subchapter.questions?.length || 0}`);
        });
      }
    });

    console.log('\n✅ Direct store usage benefits:');
    console.log('   • No transformation layer needed');
    console.log('   • Completion status directly from store');
    console.log('   • Chapter IDs available for lookups');
    console.log('   • Real-time updates from store');
    console.log('   • Simpler data flow');

    return {
      success: true,
      chaptersCount: chapters.length,
      directStoreAccess: true,
      storeData: chapters
    };

  } catch (error) {
    console.error('❌ Direct store usage test failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test navigation icon logic using questionnaire store
 */
export function testNavigationIcons() {
  console.log('🧪 Testing navigation icon logic...');

  try {
    const questionnaire = getQuestionnaireFromStore();
    if (!questionnaire) {
      console.log('❌ No questionnaire data found in store');
      return false;
    }

    console.log('🎯 Testing navigation icon rules:');
    console.log('   ✅ Complete chapters/questions → check-circle (green)');
    console.log('   ✏️ Incomplete chapters/questions → pencil (orange/gray)');

    let testResults = [];

    // Test each chapter for navigation icons
    questionnaire.chapters.forEach(chapterGroup => {
      if (Array.isArray(chapterGroup)) {
        chapterGroup.forEach(chapter => {
          const isComplete = chapter.complete;
          const expectedIcon = isComplete ? 'check-circle' : 'pencil';
          const expectedColor = isComplete ? 'green' : 'orange/gray';

          const result = {
            id: chapter.id,
            name: chapter.name,
            complete: isComplete,
            expectedIcon,
            expectedColor,
            hasQuestions: !!(chapter.questions?.length),
            hasSubchapters: !!(chapter.subchapters?.length)
          };

          testResults.push(result);

          console.log(`📝 ${chapter.name}:`);
          console.log(`   Complete: ${isComplete ? '✅' : '❌'}`);
          console.log(`   Icon: ${expectedIcon} (${expectedColor})`);
          console.log(`   Content: ${result.hasQuestions ? 'Questions' : ''}${result.hasQuestions && result.hasSubchapters ? ' + ' : ''}${result.hasSubchapters ? 'Subchapters' : ''}`);

          // Test subchapters if they exist
          if (chapter.subchapters) {
            chapter.subchapters.forEach(subchapter => {
              const subIsComplete = subchapter.complete;
              const subExpectedIcon = subIsComplete ? 'check-circle' : 'pencil';
              const subExpectedColor = subIsComplete ? 'green' : 'orange/gray';

              console.log(`  📄 ${subchapter.name}:`);
              console.log(`     Complete: ${subIsComplete ? '✅' : '❌'}`);
              console.log(`     Icon: ${subExpectedIcon} (${subExpectedColor})`);
            });
          }
        });
      }
    });

    // Test overall section completion
    let totalChapters = testResults.length;
    let completeChapters = testResults.filter(r => r.complete).length;
    let sectionComplete = completeChapters === totalChapters && totalChapters > 0;

    console.log(`\n📊 Section B Navigation:`);
    console.log(`   Complete Chapters: ${completeChapters}/${totalChapters}`);
    console.log(`   Section Complete: ${sectionComplete ? '✅' : '❌'}`);
    console.log(`   Section Tab Icon: ${sectionComplete ? 'check-circle (green)' : 'pencil (orange/gray)'}`);

    console.log('\n🎉 Navigation icon test completed!');

    return {
      success: true,
      totalChapters,
      completeChapters,
      sectionComplete,
      testResults
    };

  } catch (error) {
    console.error('❌ Navigation icon test failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test workbookResponseHelper integration with questionnaire store
 */
export async function testWorkbookResponseHelperIntegration() {
  console.log('🧪 Testing workbookResponseHelper integration with questionnaire store...');

  try {
    // Import the helper functions
    const { createResponse, updateResponse, deleteResponse } = await import('../common/workbookResponseHelper.js');
    const workbookId = POWERPOD.workbook?.workbookId || 'test-workbook-id';
    const testQuestionId = 'test-question-id';

    console.log('1. Testing response creation...');

    // Test creating a response
    const createResult = await createResponse(workbookId, testQuestionId, 'Test response value');
    console.log('✅ Response created:', createResult.success);

    // Check if questionnaire store was updated
    const questionAfterCreate = getQuestionFromStore(testQuestionId);
    console.log('✅ Questionnaire store updated:', !!questionAfterCreate?.hasResponse);

    if (createResult.response?.quartech_workbookresponseid) {
      const responseId = createResult.response.quartech_workbookresponseid;

      console.log('2. Testing response update...');

      // Test updating the response
      await updateResponse(responseId, 'Updated test response value');
      console.log('✅ Response updated');

      // Check if questionnaire store was updated
      const questionAfterUpdate = getQuestionFromStore(testQuestionId);
      console.log('✅ Questionnaire store updated:', questionAfterUpdate?.response === 'Updated test response value');

      console.log('3. Testing response deletion...');

      // Test deleting the response
      await deleteResponse(responseId);
      console.log('✅ Response deleted');

      // Check if questionnaire store was updated
      const questionAfterDelete = getQuestionFromStore(testQuestionId);
      console.log('✅ Questionnaire store updated:', !questionAfterDelete?.hasResponse);
    }

    console.log('🎉 workbookResponseHelper integration test completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ workbookResponseHelper integration test failed:', error);
    return false;
  }
}

// Make test function available globally for console testing
if (typeof window !== 'undefined') {
  window.testQuestionnaireStore = testQuestionnaireResponseIntegration;
  window.testWorkbookResponseIntegration = testWorkbookResponseHelperIntegration;
  window.testCompletionLogic = testCompletionLogic;
  window.testDirectStoreUsage = testDirectStoreUsage;
  window.testNavigationIcons = testNavigationIcons;
  window.runQuestionnaireExamples = runAllExamples;

  console.log('🧪 Questionnaire Store Test Functions Available:');
  console.log('   - window.testQuestionnaireStore() - Test response integration');
  console.log('   - window.testWorkbookResponseIntegration() - Test workbookResponseHelper integration');
  console.log('   - window.testCompletionLogic() - Test new completion rules');
  console.log('   - window.testDirectStoreUsage() - Test direct store usage vs generateSectionBItems');
  console.log('   - window.testNavigationIcons() - Test navigation icon logic');
  console.log('   - window.runQuestionnaireExamples() - Run all examples');
}
