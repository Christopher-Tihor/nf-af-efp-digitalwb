import { POWERPOD } from './constants.js';
import { getChaptersData, getWorkbookQuestionsData } from './fetch.js';
import { Logger } from './logger.js';

const logger = Logger('common/chaptersAndQuestions');

POWERPOD.chaptersAndQuestionsUtils = {
  loadChaptersAndQuestions,
  getStoredChaptersData,
  getStoredQuestionsData,
  isChaptersAndQuestionsLoaded,
  buildNestedChapterStructure,
  getChaptersWithNestedQuestionsAndSubchapters,
};

/**
 * Loads chapters and workbook questions data from the API and stores them in POWERPOD.workbook
 * @returns {Promise<Object|null>} Object with chaptersData and questionsData, or null if failed
 */
export async function loadChaptersAndQuestions() {
  try {
    logger.info({
      fn: loadChaptersAndQuestions,
      message: 'Loading chapters and workbook questions data...',
    });

    // Load chapters and workbook questions in parallel
    const [chaptersResponse, questionsResponse] = await Promise.all([
      getChaptersData(),
      getWorkbookQuestionsData(),
    ]);

    const chaptersData = chaptersResponse.data;
    const questionsData = questionsResponse.data;

    logger.info({
      fn: loadChaptersAndQuestions,
      message: 'Successfully loaded chapters and workbook questions data',
      data: {
        chaptersCount: chaptersData?.value?.length || 0,
        questionsCount: questionsData?.value?.length || 0,
      },
    });

    // Store data in POWERPOD object
    // @ts-ignore
    POWERPOD.workbook = POWERPOD.workbook || {};
    // @ts-ignore
    POWERPOD.workbook.chapters = chaptersData;
    // @ts-ignore
    POWERPOD.workbook.questions = questionsData;
    // @ts-ignore
    POWERPOD.workbook.chaptersAndQuestionsLoaded = true;

    return { chaptersData, questionsData };

  } catch (error) {
    logger.error({
      fn: loadChaptersAndQuestions,
      message: 'Failed to load chapters and workbook questions data',
      data: { error },
    });
    return null;
  }
}

/**
 * Gets the stored chapters data
 * @returns {Array|null} The chapters data or null if not loaded
 */
export function getStoredChaptersData() {
  // @ts-ignore
  return POWERPOD.workbook?.chapters || null;
}

/**
 * Gets the stored workbook questions data
 * @returns {Array|null} The questions data or null if not loaded
 */
export function getStoredQuestionsData() {
  // @ts-ignore
  return POWERPOD.workbook?.questions || null;
}

/**
 * Checks if both chapters and questions data have been loaded
 * @returns {boolean} True if both datasets are loaded
 */
export function isChaptersAndQuestionsLoaded() {
  // @ts-ignore
  return POWERPOD.workbook?.chaptersAndQuestionsLoaded === true;
}

/**
 * Gets a specific chapter by ID
 * @param {string} chapterId - The chapter ID to find
 * @returns {Object|null} The chapter object or null if not found
 */
export function getChapterById(chapterId) {
  const chapters = getStoredChaptersData();
  if (!chapters?.value) return null;
  
  return chapters.value.find(chapter => chapter.quartech_chapterid === chapterId) || null;
}

/**
 * Gets questions for a specific chapter
 * @param {string} chapterId - The chapter ID to get questions for
 * @returns {Array} Array of questions for the chapter
 */
export function getQuestionsByChapter(chapterId) {
  const questions = getStoredQuestionsData();
  if (!questions?.value) return [];
  
  return questions.value.filter(question => 
    question._quartech_chapter_value === chapterId
  );
}

/**
 * Gets all chapters with their associated questions
 * @returns {Array} Array of chapters with questions property
 */
export function getChaptersWithQuestions() {
  const chapters = getStoredChaptersData();
  const questions = getStoredQuestionsData();

  if (!chapters?.value || !questions?.value) return [];

  return chapters.value.map(chapter => ({
    ...chapter,
    questions: questions.value.filter(question =>
      question._quartech_chapter_value === chapter.quartech_chapterid
    )
  }));
}

/**
 * Builds a nested chapter structure with subchapters and questions
 * @returns {Array} Array of main chapters with nested subchapters and questions
 */
export function buildNestedChapterStructure() {
  const chapters = getStoredChaptersData();
  const questions = getStoredQuestionsData();

  if (!chapters?.value || !questions?.value) return [];

  // Separate main chapters and subchapters
  const mainChapters = chapters.value.filter(chapter =>
    !chapter._quartech_parentchapter_value
  );

  const subchapters = chapters.value.filter(chapter =>
    chapter._quartech_parentchapter_value
  );

  // Build nested structure
  return mainChapters.map(mainChapter => {
    // Find subchapters for this main chapter
    const chapterSubchapters = subchapters
      .filter(subchapter =>
        subchapter._quartech_parentchapter_value === mainChapter.quartech_chapterid
      )
      .map(subchapter => ({
        ...subchapter,
        questions: questions.value
          .filter(question =>
            question._quartech_chapter_value === subchapter.quartech_chapterid
          )
          .sort((a, b) => (a.quartech_order || 0) - (b.quartech_order || 0))
      }))
      .sort((a, b) => (a.quartech_order || 0) - (b.quartech_order || 0));

    // Find questions directly associated with the main chapter
    const mainChapterQuestions = questions.value
      .filter(question =>
        question._quartech_chapter_value === mainChapter.quartech_chapterid
      )
      .sort((a, b) => (a.quartech_order || 0) - (b.quartech_order || 0));

    return {
      ...mainChapter,
      questions: mainChapterQuestions,
      subchapters: chapterSubchapters
    };
  }).sort((a, b) => (a.quartech_order || 0) - (b.quartech_order || 0));
}

/**
 * Gets chapters with nested subchapters and questions in a clean structure
 * @returns {Array} Array of chapters with nested structure
 */
export function getChaptersWithNestedQuestionsAndSubchapters() {
  const nestedStructure = buildNestedChapterStructure();

  return nestedStructure.map(chapter => ({
    id: chapter.quartech_chapterid,
    name: chapter.quartech_name,
    label: chapter.quartech_label,
    order: chapter.quartech_order,
    description: chapter.quartech_description,
    tooltip: chapter.quartech_tooltip,
    imageUrl: chapter.quartech_imageurl,
    questions: chapter.questions.map(question => ({
      id: question.quartech_workbookquestionid,
      name: question.quartech_name,
      label: question.quartech_label,
      order: question.quartech_order,
      questionType: question.quartech_questiontype,
      textAboveQuestion: question.quartech_textabovequestion,
      textBelowQuestion: question.quartech_textbelowquestion,
      tooltip: question.quartech_tooltip,
      responseOptionColor: question.quartech_responseoptioncolor
    })),
    subchapters: chapter.subchapters.map(subchapter => ({
      id: subchapter.quartech_chapterid,
      name: subchapter.quartech_name,
      label: subchapter.quartech_label,
      order: subchapter.quartech_order,
      description: subchapter.quartech_description,
      tooltip: subchapter.quartech_tooltip,
      imageUrl: subchapter.quartech_imageurl,
      parentChapterId: subchapter._quartech_parentchapter_value,
      questions: subchapter.questions.map(question => ({
        id: question.quartech_workbookquestionid,
        name: question.quartech_name,
        label: question.quartech_label,
        order: question.quartech_order,
        questionType: question.quartech_questiontype,
        textAboveQuestion: question.quartech_textabovequestion,
        textBelowQuestion: question.quartech_textbelowquestion,
        tooltip: question.quartech_tooltip,
        responseOptionColor: question.quartech_responseoptioncolor
      }))
    }))
  }));
}
