/**
 * Loads terms and conditions data from the API and stores them in POWERPOD.workbook
 * @returns {Promise<Object|null>} Object with termsAndConditionsData, or null if failed
 */
export function loadTermsAndConditions(): Promise<Object | null>;
/**
 * Gets the stored terms and conditions data
 * @returns {Array|null} The terms and conditions data or null if not loaded
 */
export function getStoredTermsAndConditionsData(): any[] | null;
/**
 * Checks if terms and conditions data has been loaded
 * @returns {boolean} True if dataset is loaded
 */
export function isTermsAndConditionsLoaded(): boolean;
