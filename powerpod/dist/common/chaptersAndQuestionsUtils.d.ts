/**
 * Loads chapters and workbook questions data from the API and stores them in POWERPOD.workbook
 * @returns {Promise<Object|null>} Object with chaptersData and questionsData, or null if failed
 */
export function loadChaptersAndQuestions(): Promise<Object | null>;
/**
 * Gets the stored chapters data
 * @returns {Array|null} The chapters data or null if not loaded
 */
export function getStoredChaptersData(): any[] | null;
/**
 * Gets the stored workbook questions data
 * @returns {Array|null} The questions data or null if not loaded
 */
export function getStoredQuestionsData(): any[] | null;
/**
 * Checks if both chapters and questions data have been loaded
 * @returns {boolean} True if both datasets are loaded
 */
export function isChaptersAndQuestionsLoaded(): boolean;
/**
 * Gets a specific chapter by ID
 * @param {string} chapterId - The chapter ID to find
 * @returns {Object|null} The chapter object or null if not found
 */
export function getChapterById(chapterId: string): Object | null;
/**
 * Gets questions for a specific chapter
 * @param {string} chapterId - The chapter ID to get questions for
 * @returns {Array} Array of questions for the chapter
 */
export function getQuestionsByChapter(chapterId: string): any[];
/**
 * Gets all chapters with their associated questions
 * @returns {Array} Array of chapters with questions property
 */
export function getChaptersWithQuestions(): any[];
/**
 * Builds a nested chapter structure with 3 levels of hierarchy based on order numbers
 * @returns {Array} Array of main chapters with nested subchapters and questions
 */
export function buildNestedChapterStructure(): any[];
/**
 * Gets chapters with nested subchapters and questions in a clean structure
 * @returns {Array} Array of chapters with nested structure
 */
export function getChaptersWithNestedQuestionsAndSubchapters(): any[];
