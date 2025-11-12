import { POWERPOD } from './constants.js';
import { getWorkbookTermsAndConditionsData } from './fetch.js';
import { Logger } from './logger.js';

const logger = Logger('common/declarationAndConsent');

POWERPOD.declarationAndConsentUtils = {
  loadTermsAndConditions,
  getStoredTermsAndConditionsData,
  isTermsAndConditionsLoaded,
};

/**
 * Loads terms and conditions data from the API and stores them in POWERPOD.workbook
 * @returns {Promise<Object|null>} Object with termsAndConditionsData, or null if failed
 */
export async function loadTermsAndConditions() {
  try {
    logger.info({
      fn: loadTermsAndConditions,
      message: 'Loading terms and conditions data...',
    });

    // Load terms and conditions
    const [termsAndConditionsResponse] = await Promise.all([
      getWorkbookTermsAndConditionsData(),
    ]);

    const termsAndConditionsData = termsAndConditionsResponse.data;

    logger.info({
      fn: loadTermsAndConditions,
      message: 'Successfully loaded terms and conditions data',
      data: {
        termsAndConditionsCount: termsAndConditionsData?.value?.length || 0,
      },
    });

    // Store data in POWERPOD object
    // @ts-ignore
    POWERPOD.workbook = POWERPOD.workbook || {};
    // @ts-ignore
    POWERPOD.workbook.termsAndConditions = termsAndConditionsData;
    // @ts-ignore
    POWERPOD.workbook.termsAndConditionsDataLoaded = true;

    return { termsAndConditionsData };

  } catch (error) {
    logger.error({
      fn: loadTermsAndConditions,
      message: 'Failed to load terms and conditions data',
      data: { error },
    });
    return null;
  }
}

/**
 * Gets the stored terms and conditions data
 * @returns {Array|null} The terms and conditions data or null if not loaded
 */
export function getStoredTermsAndConditionsData() {
  // @ts-ignore
  return POWERPOD.workbook.termsAndConditions;
}

/**
 * Checks if terms and conditions data has been loaded
 * @returns {boolean} True if dataset is loaded
 */
export function isTermsAndConditionsLoaded() {
  // @ts-ignore
  return POWERPOD.workbook?.termsAndConditionsLoaded === true;
}

