import { Logger } from './logger.js';
import store from '../store/index.js';

const logger = Logger('common/userRoles');

/**
 * Parse user roles from the DOM element with id 'pp-user-roles'
 * The element's textContent contains role names separated by whitespace
 * Example: '\n    EFP ProducerAdministratorsAuthenticated Users\n  '
 * 
 * @returns {string[]} Array of role names
 */
export function parseUserRolesFromDOM() {
  const element = document.getElementById('pp-user-roles');
  
  if (!element) {
    logger.warn({
      fn: parseUserRolesFromDOM,
      message: 'Element with id "pp-user-roles" not found in DOM',
    });
    return [];
  }

  const textContent = element.textContent || '';
  
  if (!textContent.trim()) {
    logger.warn({
      fn: parseUserRolesFromDOM,
      message: 'Element "pp-user-roles" found but has no text content',
    });
    return [];
  }

  // Split by common role name patterns
  // Roles are typically concatenated without spaces between them
  // We need to identify role boundaries by looking for capital letters
  // Common roles: "EFP Producer", "Administrators", "Authenticated Users"
  
  // First, trim and normalize whitespace
  const normalized = textContent.trim();
  
  // Split on capital letters that follow lowercase letters or spaces
  // This regex looks for positions where a capital letter follows a lowercase letter
  const roles = [];
  let currentRole = '';
  
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const prevChar = i > 0 ? normalized[i - 1] : '';
    
    // Start a new role if we hit a capital letter after a lowercase letter
    if (char.match(/[A-Z]/) && prevChar.match(/[a-z]/)) {
      if (currentRole.trim()) {
        roles.push(currentRole.trim());
      }
      currentRole = char;
    } else if (char.match(/\S/)) {
      // Add non-whitespace characters to current role
      currentRole += char;
    } else if (char.match(/\s/) && currentRole.trim()) {
      // Whitespace might be part of role name (e.g., "Authenticated Users")
      // or it might be between roles
      // Add it tentatively
      currentRole += char;
    }
  }
  
  // Don't forget the last role
  if (currentRole.trim()) {
    roles.push(currentRole.trim());
  }

  logger.info({
    fn: parseUserRolesFromDOM,
    message: 'Parsed user roles from DOM',
    data: { rawText: textContent, parsedRoles: roles },
  });

  return roles;
}

/**
 * Load user roles from DOM and store them in the state
 */
export function loadUserRoles() {
  const roles = parseUserRolesFromDOM();
  
  store.dispatch('setUserRoles', { roles });
  
  logger.info({
    fn: loadUserRoles,
    message: 'User roles loaded into state',
    data: { roles },
  });
  
  return roles;
}

/**
 * Get user roles from state
 * @returns {string[]} Array of role names
 */
export function getUserRoles() {
  return store.state.userRoles || [];
}

/**
 * Check if user has a specific role
 * @param {string} roleName - The role name to check
 * @returns {boolean} True if user has the role
 */
export function hasRole(roleName) {
  const roles = getUserRoles();
  return roles.some(role => 
    role.toLowerCase() === roleName.toLowerCase()
  );
}

