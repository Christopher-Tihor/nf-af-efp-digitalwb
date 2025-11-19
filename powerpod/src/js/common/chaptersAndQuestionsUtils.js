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
 * Determines the hierarchy level based on order number
 * @param {number} order - Order like 4, 4.1, 4.11, 4.12, 4.2, 5.1
 * @returns {Object} Hierarchy info with level, mainChapter, subChapter, subSubChapter
 */
function parseOrderHierarchy(order) {
  if (typeof order !== 'number') return null;

  const orderStr = order.toString();
  const parts = orderStr.split('.');

  if (parts.length === 1) {
    // Level 1: 4, 5
    return {
      level: 1,
      mainChapter: parseInt(parts[0]),
      subChapter: null,
      subSubChapter: null
    };
  } else if (parts.length === 2) {
    const mainChapter = parseInt(parts[0]);
    const decimalPart = parts[1];

    if (decimalPart.length === 1) {
      // Level 2: 4.1, 4.2, 5.1 (single digit after decimal)
      return {
        level: 2,
        mainChapter: mainChapter,
        subChapter: parseInt(decimalPart),
        subSubChapter: null
      };
    } else if (decimalPart.length === 2) {
      // Level 3: 4.11, 4.12, 7.11, 7.12 (double digit after decimal)
      // Parse as 4.1.1, 4.1.2, 7.1.1, 7.1.2
      const subChapter = parseInt(decimalPart.charAt(0));
      const subSubChapter = parseInt(decimalPart.charAt(1));
      return {
        level: 3,
        mainChapter: mainChapter,
        subChapter: subChapter,
        subSubChapter: subSubChapter
      };
    }
  }

  return null;
}

/**
 * Builds a nested chapter structure with 3 levels of hierarchy based on order numbers
 * @returns {Array} Array of main chapters with nested subchapters and questions
 */
export function buildNestedChapterStructure() {
  const chapters = getStoredChaptersData();
  const questions = getStoredQuestionsData();

  if (!chapters?.value || !questions?.value) return [];

  // Group chapters by their hierarchy
  const chapterHierarchy = {};

  chapters.value.forEach(chapter => {
    const hierarchy = parseOrderHierarchy(chapter.quartech_order);
    if (!hierarchy) return;

    const { level, mainChapter, subChapter, subSubChapter } = hierarchy;



    // Initialize main chapter group if needed
    if (!chapterHierarchy[mainChapter]) {
      chapterHierarchy[mainChapter] = {
        main: null,
        subs: {},
        level1Items: []
      };
    }

    if (level === 1) {
      // This is a main chapter (e.g., order 4)
      chapterHierarchy[mainChapter].main = chapter;
    } else if (level === 2) {
      // This is a sub chapter (e.g., order 4.1, 4.2)
      if (!chapterHierarchy[mainChapter].subs[subChapter]) {
        chapterHierarchy[mainChapter].subs[subChapter] = {
          main: null,
          subSubs: []
        };
      }
      chapterHierarchy[mainChapter].subs[subChapter].main = chapter;
    } else if (level === 3) {
      // This is a sub-sub chapter (e.g., order 4.11, 4.12)
      if (!chapterHierarchy[mainChapter].subs[subChapter]) {
        chapterHierarchy[mainChapter].subs[subChapter] = {
          main: null,
          subSubs: []
        };
      }
      chapterHierarchy[mainChapter].subs[subChapter].subSubs.push(chapter);
    }
  });



  // Build the final nested structure
  const result = [];

  Object.keys(chapterHierarchy).sort((a, b) => parseInt(a) - parseInt(b)).forEach(mainChapterNum => {
    const chapterGroup = chapterHierarchy[mainChapterNum];

    // Create main chapter (or use existing one)
    let mainChapterData = chapterGroup.main;
    if (!mainChapterData) {
      // Create a synthetic main chapter if none exists
      mainChapterData = {
        quartech_chapterid: `chapter-${mainChapterNum}-main`,
        quartech_name: `CHAPTER ${mainChapterNum}`,
        quartech_label: `CHAPTER ${mainChapterNum}`,
        quartech_order: parseInt(mainChapterNum),
        quartech_description: null,
        quartech_tooltip: null,
        quartech_imageurl: null
      };
    }

    // Get questions for main chapter
    const mainChapterQuestions = questions.value
      .filter(question => question._quartech_chapter_value === mainChapterData.quartech_chapterid)
      .sort((a, b) => (a.quartech_order || 0) - (b.quartech_order || 0));

    // Build subchapters
    const subchapters = [];
    Object.keys(chapterGroup.subs).sort((a, b) => parseInt(a) - parseInt(b)).forEach(subChapterNum => {
      const subGroup = chapterGroup.subs[subChapterNum];

      if (subGroup.main) {
        // Get questions for this subchapter
        const subChapterQuestions = questions.value
          .filter(question => question._quartech_chapter_value === subGroup.main.quartech_chapterid)
          .sort((a, b) => (a.quartech_order || 0) - (b.quartech_order || 0));

        // Build sub-subchapters
        const subSubchapters = subGroup.subSubs.map(subSubChapter => ({
          ...subSubChapter,
          questions: questions.value
            .filter(question => question._quartech_chapter_value === subSubChapter.quartech_chapterid)
            .sort((a, b) => (a.quartech_order || 0) - (b.quartech_order || 0))
        })).sort((a, b) => (a.quartech_order || 0) - (b.quartech_order || 0));

        subchapters.push({
          ...subGroup.main,
          questions: subChapterQuestions,
          subchapters: subSubchapters
        });
      }
    });

    result.push({
      ...mainChapterData,
      questions: mainChapterQuestions,
      subchapters: subchapters
    });
  });

  return result;
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
    questions: (chapter.questions || []).map(question => ({
      id: question.quartech_workbookquestionid,
      name: question.quartech_name,
      label: question.quartech_label,
      order: question.quartech_order,
      questionType: question.quartech_questiontype,
      textAboveQuestion: question.quartech_textabovequestion,
      textBelowQuestion: question.quartech_textbelowquestion,
      tooltip: question.quartech_tooltip,
      responseOptionColor: question.quartech_responseoptioncolor,
      multiselectOptions: question.quartech_multiselectoptions,
      rating1OverwriteLabel: question.quartech_rating1overwritelabel,
      rating1Description: question.quartech_rating1description,
      rating2OverwriteLabel: question.quartech_rating2overwritelabel,
      rating2Description: question.quartech_rating2description,
      rating3OverwriteLabel: question.quartech_rating3overwritelabel,
      rating3Description: question.quartech_rating3description,
      rating4OverwriteLabel: question.quartech_rating4overwritelabel,
      rating4Description: question.quartech_rating4description
    })),
    subchapters: (chapter.subchapters || []).map(subchapter => ({
      id: subchapter.quartech_chapterid,
      name: subchapter.quartech_name,
      label: subchapter.quartech_label,
      order: subchapter.quartech_order,
      description: subchapter.quartech_description,
      tooltip: subchapter.quartech_tooltip,
      imageUrl: subchapter.quartech_imageurl,
      parentChapterId: subchapter._quartech_parentchapter_value,
      questions: (subchapter.questions || []).map(question => ({
        id: question.quartech_workbookquestionid,
        name: question.quartech_name,
        label: question.quartech_label,
        order: question.quartech_order,
        questionType: question.quartech_questiontype,
        textAboveQuestion: question.quartech_textabovequestion,
        textBelowQuestion: question.quartech_textbelowquestion,
        tooltip: question.quartech_tooltip,
        responseOptionColor: question.quartech_responseoptioncolor,
        multiselectOptions: question.quartech_multiselectoptions,
        rating1OverwriteLabel: question.quartech_rating1overwritelabel,
        rating1Description: question.quartech_rating1description,
        rating2OverwriteLabel: question.quartech_rating2overwritelabel,
        rating2Description: question.quartech_rating2description,
        rating3OverwriteLabel: question.quartech_rating3overwritelabel,
        rating3Description: question.quartech_rating3description,
        rating4OverwriteLabel: question.quartech_rating4overwritelabel,
        rating4Description: question.quartech_rating4description
      })),
      // Handle 3rd level subchapters (sub-subchapters)
      subchapters: (subchapter.subchapters || []).map(subSubchapter => ({
        id: subSubchapter.quartech_chapterid,
        name: subSubchapter.quartech_name,
        label: subSubchapter.quartech_label,
        order: subSubchapter.quartech_order,
        description: subSubchapter.quartech_description,
        tooltip: subSubchapter.quartech_tooltip,
        imageUrl: subSubchapter.quartech_imageurl,
        parentChapterId: subSubchapter._quartech_parentchapter_value,
        questions: (subSubchapter.questions || []).map(question => ({
          id: question.quartech_workbookquestionid,
          name: question.quartech_name,
          label: question.quartech_label,
          order: question.quartech_order,
          questionType: question.quartech_questiontype,
          textAboveQuestion: question.quartech_textabovequestion,
          textBelowQuestion: question.quartech_textbelowquestion,
          tooltip: question.quartech_tooltip,
          responseOptionColor: question.quartech_responseoptioncolor,
          multiselectOptions: question.quartech_multiselectoptions,
          rating1OverwriteLabel: question.quartech_rating1overwritelabel,
          rating1Description: question.quartech_rating1description,
          rating2OverwriteLabel: question.quartech_rating2overwritelabel,
          rating2Description: question.quartech_rating2description,
          rating3OverwriteLabel: question.quartech_rating3overwritelabel,
          rating3Description: question.quartech_rating3description,
          rating4OverwriteLabel: question.quartech_rating4overwritelabel,
          rating4Description: question.quartech_rating4description
        }))
      }))
    }))
  }));
}
