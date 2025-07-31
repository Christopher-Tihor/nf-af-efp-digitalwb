import { POWERPOD } from './constants.js';
import { getWorkbookDataById } from './fetch.js';
import { Logger } from './logger.js';

const logger = Logger('common/workbook');

POWERPOD.workbookUtils = {
  getWorkbookId,
  loadWorkbookData,
  isWorkbookInitialized,
  getWorkbookData,
  getCurrentWorkbookId,
  getNestedChapterStructure,
};

/**
 * Gets the workbook ID from URL parameters or DOM elements
 * @returns {string|null} The workbook ID or null if not found
 */
export function getWorkbookId() {
  if (window.location.hostname === 'localhost') {
    return 'test-workbook-id'; // Default for local development
  }

  // Try to get workbook ID from URL parameters
  const params = new URLSearchParams(window.location.search);
  let workbookId = params.get('id');

  if (workbookId) {
    logger.info({
      fn: getWorkbookId,
      message: `Successfully retrieved workbook id from url params: ${workbookId}`,
    });
    return workbookId;
  }

  // Try to get from DOM element (similar to other forms)
  const workbookElement = document.querySelector('#quartech_workbook');
  if (workbookElement && 'value' in workbookElement && typeof workbookElement.value === 'string') {
    workbookId = workbookElement.value;
    logger.info({
      fn: getWorkbookId,
      message: `Successfully retrieved workbook id from DOM element: ${workbookId}`,
    });
    return workbookId;
  }

  logger.warn({
    fn: getWorkbookId,
    message: 'Could not find workbook id in URL params or DOM elements',
  });
  return null;
}

/**
 * Loads workbook data from the API and stores it in POWERPOD.workbook
 * @param {string} workbookId - The workbook ID to load
 * @returns {Promise<Object|null>} The workbook data or null if failed
 */
export async function loadWorkbookData(workbookId) {
  if (!workbookId) {
    logger.warn({
      fn: loadWorkbookData,
      message: 'No workbook ID provided',
    });
    return null;
  }

  try {
    logger.info({
      fn: loadWorkbookData,
      message: `Fetching workbook data for ID: ${workbookId}`,
    });

    const response = await getWorkbookDataById({ id: workbookId });
    const workbookData = response.data;

    logger.info({
      fn: loadWorkbookData,
      message: 'Successfully fetched workbook data',
      data: workbookData,
    });

    // Store workbook data globally for use by components
    // @ts-ignore
    POWERPOD.workbook = {
      id: workbookId,
      data: workbookData,
      initialized: true,
    };

    return workbookData;

  } catch (error) {
    logger.error({
      fn: loadWorkbookData,
      message: 'Failed to fetch workbook data',
      data: { workbookId, error },
    });
    return null;
  }
}

/**
 * Checks if the workbook has been initialized
 * @returns {boolean} True if workbook is initialized
 */
export function isWorkbookInitialized() {
  // @ts-ignore
  return POWERPOD.workbook?.initialized === true;
}

/**
 * Gets the current workbook data
 * @returns {Object|null} The workbook data or null if not loaded
 */
export function getWorkbookData() {
  // @ts-ignore
  return POWERPOD.workbook?.data || null;
}

/**
 * Gets the current workbook ID
 * @returns {string|null} The workbook ID or null if not loaded
 */
export function getCurrentWorkbookId() {
  // @ts-ignore
  return POWERPOD.workbook?.id || null;
}

/**
 * Gets the nested chapter structure with subchapters and questions
 * @returns {Array|null} The nested chapter structure or null if not loaded
 */
export function getNestedChapterStructure() {
  // @ts-ignore
  return POWERPOD.workbook?.nestedStructure || null;
}
