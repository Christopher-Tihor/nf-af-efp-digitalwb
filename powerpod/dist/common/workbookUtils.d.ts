/**
 * Gets the workbook ID from URL parameters or DOM elements
 * @returns {string|null} The workbook ID or null if not found
 */
export function getWorkbookId(): string | null;
/**
 * Loads workbook data from the API and stores it in POWERPOD.workbook
 * @param {string} workbookId - The workbook ID to load
 * @returns {Promise<Object|null>} The workbook data or null if failed
 */
export function loadWorkbookData(workbookId: string): Promise<Object | null>;
/**
 * Checks if the workbook has been initialized
 * @returns {boolean} True if workbook is initialized
 */
export function isWorkbookInitialized(): boolean;
/**
 * Gets the current workbook data
 * @returns {Object|null} The workbook data or null if not loaded
 */
export function getWorkbookData(): Object | null;
/**
 * Gets the current workbook ID
 * @returns {string|null} The workbook ID or null if not loaded
 */
export function getCurrentWorkbookId(): string | null;
/**
 * Gets the nested chapter structure with subchapters and questions
 * @returns {Array|null} The nested chapter structure or null if not loaded
 */
export function getNestedChapterStructure(): any[] | null;
export function isPASignedOff(): boolean;
export function isProducerSignedOff(): boolean;
/**
 * @param {boolean} signedOff
 */
export function setPASignedOff(signedOff: boolean): void;
/**
 * @param {boolean} signedOff
 */
export function setProducerSignedOff(signedOff: boolean): void;
