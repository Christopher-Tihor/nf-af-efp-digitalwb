/**
 * Parse user roles from the DOM element with id 'pp-user-roles'
 * The element's textContent contains role names separated by whitespace
 * Example: '\n    EFP ProducerAdministratorsAuthenticated Users\n  '
 *
 * @returns {string[]} Array of role names
 */
export function parseUserRolesFromDOM(): string[];
/**
 * Load user roles from DOM and store them in the state
 */
export function loadUserRoles(): string[];
/**
 * Get user roles from state
 * @returns {string[]} Array of role names
 */
export function getUserRoles(): string[];
/**
 * Check if user has a specific role
 * @param {string} roleName - The role name to check
 * @returns {boolean} True if user has the role
 */
export function hasRole(roleName: string): boolean;
