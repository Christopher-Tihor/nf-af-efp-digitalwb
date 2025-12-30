import { Logger } from './logger.js';
import store from '../store/index.js';

const logger = Logger('common/userRoles');

/**
 * Parse user roles from the DOM element with id 'pp-user-roles'
 * The element's textContent can be either:
 * 1. JSON array format: '[{"Name":"EFP Producer"},{"Name":"Administrators"}]'
 * 2. Concatenated string format: 'EFP ProducerAdministratorsAuthenticated Users'
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

  const normalized = textContent.trim();

  // Try to parse as JSON first (new format from template)
  if (normalized.startsWith('[') || normalized.startsWith('{')) {
    try {
      const parsed = JSON.parse(normalized);

      // Handle array of role objects: [{"Name":"EFP Producer"}]
      if (Array.isArray(parsed)) {
        const roles = parsed.map(role => {
          if (typeof role === 'string') {
            return role;
          } else if (role && typeof role === 'object') {
            // Try common property names
            return role.Name || role.name || role.RoleName || role.roleName || '';
          }
          return '';
        }).filter(role => role.trim() !== '');

        logger.info({
          fn: parseUserRolesFromDOM,
          message: 'Parsed user roles from DOM (JSON format)',
          data: { rawText: textContent, parsedRoles: roles },
        });

        return roles;
      }

      // Handle single role object: {"Name":"EFP Producer"}
      if (parsed && typeof parsed === 'object') {
        const roleName = parsed.Name || parsed.name || parsed.RoleName || parsed.roleName || '';
        const roles = roleName ? [roleName] : [];

        logger.info({
          fn: parseUserRolesFromDOM,
          message: 'Parsed user roles from DOM (JSON object format)',
          data: { rawText: textContent, parsedRoles: roles },
        });

        return roles;
      }
    } catch (error) {
      logger.warn({
        fn: parseUserRolesFromDOM,
        message: 'Failed to parse roles as JSON, falling back to string parsing',
        data: { error: error.message, textContent },
      });
    }
  }

  // Fall back to legacy string parsing for concatenated format
  // Use a list of known roles to extract from the concatenated string
  const knownRoles = [
    'EFP Producer',
    'EFP Planning Advisor',
    'Administrators',
    'Authenticated Users',
    'Anonymous Users',
  ];

  const roles = [];

  // Check for each known role in the text
  for (const role of knownRoles) {
    if (normalized.includes(role)) {
      roles.push(role);
    }
  }

  // If no known roles found, try the old parsing logic as a fallback
  if (roles.length === 0) {
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
  }

  logger.info({
    fn: parseUserRolesFromDOM,
    message: 'Parsed user roles from DOM (string format)',
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

