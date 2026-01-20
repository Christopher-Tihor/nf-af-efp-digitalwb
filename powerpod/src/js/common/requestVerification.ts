import { Logger } from './logger.js';

const logger = Logger('common/requestVerification');

/**
 * Gets the request verification token from the DOM.
 */
export function getRequestVerificationToken() {
  let requestVerificationToken = $(
    'input[name=__RequestVerificationToken]'
  ).val();
  if (!requestVerificationToken) {
    logger.error({
      fn: getRequestVerificationToken,
      message: 'Could not find input[name=__RequestVerificationToken]',
    });
  }
  logger.info({
    fn: getRequestVerificationToken,
    message: `Successfully found __RequestVerificationToken: ${requestVerificationToken}`,
  });
  return requestVerificationToken;
}

/**
 * Preloads the request verification token by fetching it from the antiforgery endpoint
 * if it's not already present in the DOM.
 *
 * Note: This function uses dynamic import to avoid circular dependency with fetch.js
 */
export async function preloadRequestVerificationToken() {
  let requestVerificationToken = $(
    'input[name=__RequestVerificationToken]'
  ).val();
  if (requestVerificationToken) {
    logger.info({
      fn: preloadRequestVerificationToken,
      message: `No need to preload token, exists already, __RequestVerificationToken: ${requestVerificationToken}`,
    });
    return;
  }

  logger.info({
    fn: preloadRequestVerificationToken,
    message:
      'Could not find input[name=__RequestVerificationToken], attempt finding antiforgerytoken div',
  });

  const tokenUrlDiv = document.getElementById('antiforgerytoken');
  if (!tokenUrlDiv) {
    logger.error({
      fn: preloadRequestVerificationToken,
      message:
        'Could not find antiforgerytoken, failed to find verificationtoken',
    });
    return;
  }
  const tokenUrl = tokenUrlDiv.getAttribute('data-url');
  if (!tokenUrl) {
    logger.error({
      fn: preloadRequestVerificationToken,
      message:
        'Could not find antiforgerytoken URL, failed to find verificationtoken',
    });
    return;
  }

  // Use dynamic import to avoid circular dependency with fetch.js
  const { fetch } = await import('./fetch.js');

  const { data: tokenResultString } = await fetch({
    url: tokenUrl,
    returnData: true,
  });

  // Create a temporary container element in memory
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = tokenResultString;
  const inputElement = tempDiv.querySelector('input');
  const token = inputElement?.getAttribute('value');

  if (!token) {
    logger.error({
      fn: preloadRequestVerificationToken,
      message: 'Failed to load verification token from antiforgery url',
    });
    return;
  }

  requestVerificationToken = token;

  // set DOM HTML content for easy/immediate fetching later
  tokenUrlDiv.innerHTML = `<input name="__RequestVerificationToken" type="hidden" value="${requestVerificationToken}">`;

  logger.info({
    fn: preloadRequestVerificationToken,
    message: `Successfully created token input element with __RequestVerificationToken: ${requestVerificationToken}`,
  });
}

