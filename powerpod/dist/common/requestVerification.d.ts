/**
 * Gets the request verification token from the DOM.
 */
export declare function getRequestVerificationToken(): string | number | string[] | undefined;
/**
 * Preloads the request verification token by fetching it from the antiforgery endpoint
 * if it's not already present in the DOM.
 *
 * Note: This function uses dynamic import to avoid circular dependency with fetch.js
 */
export declare function preloadRequestVerificationToken(): Promise<void>;
